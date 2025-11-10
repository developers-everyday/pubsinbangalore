import { z } from "zod";

import type { PubDetail } from "@/lib/supabase/queries";

import { createAiClient } from "./client";
import { buildAttributePrompt, buildDescriptionPrompt } from "./prompts";
import type { AiResponse, AttributeResult, DescriptionResult, EnrichmentResult } from "./types";

const DescriptionSchema = z.object({
  summary: z.string().min(20).max(320),
  highlights: z.array(z.string().min(3).max(80)).length(3),
});

const AttributeSchema = z.object({
  attributes: z.record(z.string(), z.unknown()),
});

export type GenerationConfig = {
  dryRunFallback?: Partial<DescriptionResult & AttributeResult>;
};

async function callOpenAI(prompt: string, model: string, jsonMode = true) {
  const client = createAiClient();
  if (client.provider !== "openai" || !client.openai) {
    throw new Error("OpenAI provider not initialised");
  }

  const completion = await client.openai.chat.completions.create({
    model,
    temperature: 0,
    response_format: jsonMode ? { type: "json_object" } : undefined,
    messages: [
      {
        role: "system",
        content: "You are a structured data generator. Always return valid JSON only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Unexpected OpenAI response payload");
  }

  return {
    content,
    provider: "openai" as const,
    model,
    usage: {
      inputTokens: completion.usage?.prompt_tokens ?? undefined,
      outputTokens: completion.usage?.completion_tokens ?? undefined,
    },
  } satisfies AiResponse;
}

async function callAnthropic(prompt: string, model: string) {
  const client = createAiClient();
  if (client.provider !== "anthropic" || !client.anthropic) {
    throw new Error("Anthropic provider not initialised");
  }

  const completion = await client.anthropic.messages.create({
    model,
    max_tokens: 800,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const text = completion.content?.[0]?.type === "text" ? completion.content[0].text : undefined;
  if (!text) {
    throw new Error("Unexpected Anthropic response payload");
  }

  return {
    content: text,
    provider: "anthropic" as const,
    model,
    usage: {
      inputTokens: completion.usage?.input_tokens,
      outputTokens: completion.usage?.output_tokens,
    },
  } satisfies AiResponse;
}

function stubResponse(data: EnrichmentResult): AiResponse {
  return {
    provider: "stub",
    model: "stub",
    content: JSON.stringify(data, null, 2),
    parsed: data,
  };
}

function parseJson<T extends z.ZodTypeAny>(raw: string, schema: T): z.infer<T> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse JSON output: ${(error as Error).message}`);
  }
  try {
    return schema.parse(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`LLM output validation error: ${error.message}`);
    }
    throw error;
  }
}

export async function generateDescription(pub: PubDetail, config?: GenerationConfig): Promise<AiResponse> {
  const client = createAiClient();
  if (client.dryRun) {
    return stubResponse({
      summary: config?.dryRunFallback?.summary ?? `${pub.name} is a lively spot in ${pub.locality_name ?? "Bangalore"}.`,
      highlights: config?.dryRunFallback?.highlights ?? ["Live music nights", "Craft cocktails", "Late-night rooftop"],
    });
  }

  const prompt = buildDescriptionPrompt(pub);
  const raw =
    client.provider === "openai"
      ? await callOpenAI(prompt, client.model)
      : client.provider === "anthropic"
      ? await callAnthropic(prompt, client.model)
      : stubResponse({ summary: "", highlights: [] });

  const parsed = parseJson(raw.content, DescriptionSchema);
  return { ...raw, parsed } satisfies AiResponse;
}

export async function generateAttributes(pub: PubDetail, config?: GenerationConfig): Promise<AiResponse> {
  const client = createAiClient();
  if (client.dryRun) {
    const attributes = config?.dryRunFallback?.attributes ?? {
      live_music: true,
      music_genres: ["rock", "retro"],
      cover_redeemable: pub.cover_charge_redeemable ?? false,
    };
    return stubResponse({ attributes });
  }

  const prompt = buildAttributePrompt(pub);
  const raw =
    client.provider === "openai"
      ? await callOpenAI(prompt, client.model)
      : client.provider === "anthropic"
      ? await callAnthropic(prompt, client.model)
      : stubResponse({ attributes: {} });

  const parsed = parseJson(raw.content, AttributeSchema);
  return { ...raw, parsed } satisfies AiResponse;
}
