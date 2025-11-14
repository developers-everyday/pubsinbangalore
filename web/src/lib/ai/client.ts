import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

type Provider = "openai" | "anthropic" | "stub";

export interface AiClientConfig {
  provider: Provider;
  model: string;
  dryRun: boolean;
}

export interface AiClient extends AiClientConfig {
  openai?: OpenAI;
  anthropic?: Anthropic;
}

const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL ?? process.env.AI_MODEL ?? "gpt-4o-mini";
const DEFAULT_ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? process.env.AI_MODEL ?? "claude-3-haiku-20240307";

export function createAiClient(): AiClient {
  const openAiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const dryRun = process.env.AI_DRY_RUN === "true";

  if (dryRun || (!openAiKey && !anthropicKey)) {
    return {
      provider: "stub",
      model: "stub",
      dryRun: true,
    };
  }

  if (openAiKey) {
    return {
      provider: "openai",
      model: DEFAULT_OPENAI_MODEL,
      dryRun: false,
      openai: new OpenAI({ apiKey: openAiKey }),
    };
  }

  if (anthropicKey) {
    return {
      provider: "anthropic",
      model: DEFAULT_ANTHROPIC_MODEL,
      dryRun: false,
      anthropic: new Anthropic({ apiKey: anthropicKey }),
    };
  }

  return {
    provider: "stub",
    model: "stub",
    dryRun: true,
  };
}
