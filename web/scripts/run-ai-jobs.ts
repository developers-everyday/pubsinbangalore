import process from "node:process";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { createAiClient } from "@/lib/ai/client";
import { generateAttributes, generateDescription } from "@/lib/ai/generate";
import type { EnrichmentJobType, EnrichmentResult } from "@/lib/ai/types";
import type { Database, Json } from "@/lib/supabase/types";
import type { PubDetail } from "@/lib/supabase/queries";

const JobSchema = z.object({
  id: z.string(),
  pub_id: z.string(),
  job_type: z.string(),
  status: z.string(),
  payload: z.any().nullable(),
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_LIMIT = Number(process.env.AI_BATCH_LIMIT ?? "5");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase service configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function fetchPendingJobs(limit: number) {
  const { data, error } = await supabase
    .from("ai_content_jobs")
    .select("id, pub_id, job_type, status, payload")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch pending jobs: ${error.message}`);
  }

  return JobSchema.array().parse(data ?? []);
}

async function markJobStatus(
  id: string,
  status: "processing" | "awaiting_review" | "failed",
  extra: Database["public"]["Tables"]["ai_content_jobs"]["Update"] = {},
) {
  const updates: Database["public"]["Tables"]["ai_content_jobs"]["Update"] = {
    status,
    updated_at: new Date().toISOString(),
    ...extra,
  };

  const { error } = await supabase
    .from("ai_content_jobs")
    .update(updates)
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update job ${id}: ${error.message}`);
  }
}

async function fetchPubDetail(pubId: string): Promise<PubDetail | null> {
  const { data, error } = await supabase
    .from("pubs")
    .select(
      `id, name, slug, description, google_maps_url, website_url, phone,
       status, average_rating, review_count, cost_for_two_min, cost_for_two_max,
       cover_charge_min, cover_charge_max, cover_charge_redeemable, wifi_available,
       valet_available, stag_entry_policy, couples_entry_policy, happy_hours_note,
       operating_hours_raw,
       pub_localities(locality_id, localities(name, slug, city)),
       pub_attribute_values(
         boolean_value,
         int_value,
         numeric_min,
         numeric_max,
         text_value,
         tags_value,
         schedule_value,
         rating_value,
         attributes(code, label, data_type)
       )`
    )
    .eq("id", pubId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load pub ${pubId}: ${error.message}`);
  }
  if (!data) return null;

  const locality = data.pub_localities?.[0]?.localities ?? null;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    google_maps_url: data.google_maps_url,
    website_url: data.website_url,
    phone: data.phone,
    status: data.status,
    average_rating: data.average_rating,
    review_count: data.review_count,
    cost_for_two_min: data.cost_for_two_min,
    cost_for_two_max: data.cost_for_two_max,
    cover_charge_min: data.cover_charge_min,
    cover_charge_max: data.cover_charge_max,
    cover_charge_redeemable: data.cover_charge_redeemable,
    wifi_available: data.wifi_available,
    valet_available: data.valet_available,
    stag_entry_policy: data.stag_entry_policy,
    couples_entry_policy: data.couples_entry_policy,
    happy_hours_note: data.happy_hours_note,
    locality_slug: locality?.slug ?? null,
    locality_name: locality?.name ?? null,
    operating_hours_raw: (data.operating_hours_raw as Record<string, string> | null) ?? null,
    attributes: (data.pub_attribute_values ?? [])
      .map((entry) => {
        const attributeMeta = entry.attributes;
        if (!attributeMeta?.code) return null;

        let value: PubDetail["attributes"][number]["value"] = null;
        let displayValue: string | null = null;

        if (entry.boolean_value !== null) {
          value = entry.boolean_value;
          displayValue = entry.boolean_value ? "Yes" : "No";
        } else if (entry.tags_value && entry.tags_value.length > 0) {
          value = entry.tags_value.map(String);
          displayValue = value.join(", ");
        } else if (entry.numeric_min !== null || entry.numeric_max !== null) {
          const min = entry.numeric_min ?? entry.numeric_max;
          const max = entry.numeric_max ?? entry.numeric_min;
          if (min !== null && max !== null && min !== max) {
            displayValue = `${min} – ${max}`;
            value = min;
          } else {
            const single = min ?? max;
            if (single !== null) {
              displayValue = single.toString();
              value = single;
            }
          }
        } else if (entry.rating_value !== null) {
          value = entry.rating_value;
          displayValue = `${entry.rating_value}/5`;
        } else if (entry.text_value) {
          value = entry.text_value;
          displayValue = entry.text_value;
        } else if (entry.schedule_value) {
          value = JSON.stringify(entry.schedule_value);
          displayValue = "See schedule";
        }

        return {
          code: attributeMeta.code,
          label: attributeMeta.label ?? attributeMeta.code,
          type: attributeMeta.data_type ?? "text",
          value,
          displayValue,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item)),
  } satisfies PubDetail;
}

async function processJob(job: z.infer<typeof JobSchema>) {
  await markJobStatus(job.id, "processing", { error: null });

  const pub = await fetchPubDetail(job.pub_id);
  if (!pub) {
    await markJobStatus(job.id, "failed", { error: { message: "Pub not found" } as Json });
    return;
  }

  const client = createAiClient();
  if (client.dryRun) {
    console.warn(`AI_DRY_RUN enabled – generating stub output for job ${job.id}.`);
  }

  let result: EnrichmentResult = {};

  try {
    switch (job.job_type as EnrichmentJobType) {
      case "description": {
        const response = await generateDescription(pub);
        const parsed = response.parsed ?? JSON.parse(response.content);
        result = { ...result, ...parsed };
        break;
      }
      case "attributes": {
        const response = await generateAttributes(pub);
        const parsed = response.parsed ?? JSON.parse(response.content);
        result = { ...result, ...parsed };
        break;
      }
      case "full_enrichment": {
        const [descriptionResp, attributesResp] = await Promise.all([
          generateDescription(pub),
          generateAttributes(pub),
        ]);
        const description = descriptionResp.parsed ?? JSON.parse(descriptionResp.content);
        const attributes = attributesResp.parsed ?? JSON.parse(attributesResp.content);
        result = { ...description, ...attributes };
        break;
      }
      default: {
        await markJobStatus(job.id, "failed", {
          error: { message: `Unsupported job_type: ${job.job_type}` } as Json,
        });
        return;
      }
    }

    const output = JSON.parse(JSON.stringify(result)) as Json;

    await markJobStatus(job.id, "awaiting_review", {
      output,
      completed_at: new Date().toISOString(),
    });

    console.log(`✔ Job ${job.id} (${job.job_type}) ready for review for pub ${pub.name}`);
  } catch (error) {
    console.error(`✖ Job ${job.id} failed`, error);
    const errorPayload = { message: (error as Error).message } as Json;
    await markJobStatus(job.id, "failed", {
      error: errorPayload,
    });
  }
}

async function main() {
  const jobs = await fetchPendingJobs(BATCH_LIMIT);
  if (jobs.length === 0) {
    console.log("No pending AI jobs. You're all caught up! 🎉");
    return;
  }

  for (const job of jobs) {
    await processJob(job);
  }
}

main().catch((error) => {
  console.error("Fatal error in AI job runner", error);
  process.exit(1);
});
