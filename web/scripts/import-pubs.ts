import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database, Json } from "@/lib/supabase/types";

type SupabaseClient = ReturnType<typeof createSupabaseServiceClient>;

const ingestResultSchema = z.object({
  summary: z.object({
    input_rows: z.number(),
    post_dedupe: z.number(),
    imported: z.number(),
    skipped: z.number(),
    timestamp: z.string(),
  }),
  imported: z
    .array(
      z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string().nullable(),
        google_maps_url: z.string().url(),
        website_url: z.string().url().nullable(),
        phone: z.string().nullable(),
        status: z.string(),
        average_rating: z.number().nullable(),
        review_count: z.number().nullable(),
        cost_for_two_min: z.number().nullable().optional(),
        cost_for_two_max: z.number().nullable().optional(),
        cover_charge_min: z.number().nullable().optional(),
        cover_charge_max: z.number().nullable().optional(),
        cover_charge_redeemable: z.boolean().nullable().optional(),
        stag_entry_policy: z.string().nullable().optional(),
        couples_entry_policy: z.string().nullable().optional(),
        wheelchair_accessible: z.boolean().nullable().optional(),
        wifi_available: z.boolean().nullable().optional(),
        valet_available: z.boolean().nullable().optional(),
        happy_hours_note: z.string().nullable().optional(),
        operating_hours_raw: z.record(z.string(), z.string()).nullable(),
        locality_slug: z.string().nullable(),
      })
    )
    .nonempty({ message: "No imported rows found in ingestion payload." }),
});

type IngestedPub = z.infer<typeof ingestResultSchema>["imported"][number];

type PubInsert = Database["public"]["Tables"]["pubs"]["Insert"];
type PubLocalityInsert = Database["public"]["Tables"]["pub_localities"]["Insert"];

function usage(): never {
  console.error(
    "Usage: npm run import:pubs -- --input /absolute/path/to/ingest-output.json"
  );
  process.exit(1);
}

async function loadArgs() {
  const args = process.argv.slice(2);
  const inputIndex = args.indexOf("--input");
  if (inputIndex === -1 || inputIndex === args.length - 1) {
    usage();
  }

  const inputPath = resolve(args[inputIndex + 1]);
  if (!inputPath.startsWith("/")) {
    console.error("--input must be an absolute path");
    process.exit(1);
  }

  return { inputPath };
}

function createSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error(
      "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
    process.exit(1);
  }

  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function loadLocalityMap(client: SupabaseClient) {
  const { data, error } = await client
    .from("localities")
    .select("id, slug")
    .order("name");

  if (error) {
    throw new Error(`Failed to load localities: ${error.message}`);
  }

  const map = new Map<string, string>();
  for (const locality of data ?? []) {
    map.set(locality.slug, locality.id);
  }
  return map;
}

function chunk<T>(input: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < input.length; i += size) {
    result.push(input.slice(i, i + size));
  }
  return result;
}

function toJson(value: Record<string, string> | null | undefined): Json | null {
  if (!value) return null;
  return value as Json;
}

function toPubUpsert(row: IngestedPub): PubInsert {
  return {
    name: row.name,
    slug: row.slug,
    description: row.description,
    google_maps_url: row.google_maps_url,
    website_url: row.website_url,
    phone: row.phone,
    status: row.status,
    average_rating: row.average_rating,
    review_count: row.review_count,
    cost_for_two_min: row.cost_for_two_min ?? null,
    cost_for_two_max: row.cost_for_two_max ?? null,
    cover_charge_min: row.cover_charge_min ?? null,
    cover_charge_max: row.cover_charge_max ?? null,
    cover_charge_redeemable: row.cover_charge_redeemable ?? null,
    stag_entry_policy: row.stag_entry_policy ?? null,
    couples_entry_policy: row.couples_entry_policy ?? null,
    wheelchair_accessible: row.wheelchair_accessible ?? null,
    wifi_available: row.wifi_available ?? null,
    valet_available: row.valet_available ?? null,
    happy_hours_note: row.happy_hours_note ?? null,
    operating_hours_raw: toJson(row.operating_hours_raw),
  };
}

async function persistBatch(
  client: SupabaseClient,
  batch: IngestedPub[],
  localityMap: Map<string, string>
) {
  const pubUpserts = batch.map(toPubUpsert);

  const { data, error } = await client
    .from("pubs")
    .upsert(pubUpserts, {
      onConflict: "slug",
    })
    .select("id, slug");

  if (error) {
    throw new Error(`Failed to upsert pubs: ${error.message}`);
  }

  const pubIdBySlug = new Map<string, string>();
  for (const row of data ?? []) {
    pubIdBySlug.set(row.slug, row.id);
  }

  const localityLinks: PubLocalityInsert[] = [];

  for (const row of batch) {
    if (!row.locality_slug) continue;
    const localityId = localityMap.get(row.locality_slug);
    const pubId = pubIdBySlug.get(row.slug);
    if (!localityId || !pubId) continue;
    localityLinks.push({
      pub_id: pubId,
      locality_id: localityId,
      is_primary: true,
    });
  }

  if (localityLinks.length > 0) {
    const { error: linkError } = await client
      .from("pub_localities")
      .upsert(localityLinks, { onConflict: "pub_id,locality_id" });
    if (linkError) {
      throw new Error(`Failed to upsert pub_localities: ${linkError.message}`);
    }
  }
}

async function main() {
  const { inputPath } = await loadArgs();
  const raw = await readFile(inputPath, "utf-8");
  const parsed = ingestResultSchema.safeParse(JSON.parse(raw));

  if (!parsed.success) {
    console.error("Invalid ingestion payload:");
    console.error(parsed.error.format());
    process.exit(1);
  }

  const client = createSupabaseServiceClient();
  const localityMap = await loadLocalityMap(client);
  const batchSize = Number(process.env.IMPORT_BATCH_SIZE ?? "50");
  const rows = parsed.data.imported;

  const batches = chunk(rows, batchSize);
  console.log(`Importing ${rows.length} pubs across ${batches.length} batch(es)...`);

  for (const [index, batch] of batches.entries()) {
    await persistBatch(client, batch, localityMap);
    console.log(`✔ Batch ${index + 1}/${batches.length} processed (${batch.length} pubs)`);
  }

  console.log("All batches imported successfully.");
}

await main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
