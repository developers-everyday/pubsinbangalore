import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/supabase/types";

import type { AttributeResult, DescriptionResult, EnrichmentResult } from "./types";

type AttributeValueSnapshot = Pick<
  Database["public"]["Tables"]["pub_attribute_values"]["Row"],
  | "boolean_value"
  | "int_value"
  | "numeric_min"
  | "numeric_max"
  | "text_value"
  | "tags_value"
  | "schedule_value"
  | "rating_value"
>;

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? null)) as Json;
}

function denormaliseAttributeValue(row: AttributeValueSnapshot): unknown {
  if (row.boolean_value !== null) return row.boolean_value;
  if (row.rating_value !== null) return row.rating_value;
  if (row.int_value !== null) return row.int_value;
  if (row.tags_value && row.tags_value.length > 0) return row.tags_value;
  if (row.numeric_min !== null || row.numeric_max !== null) {
    const min = row.numeric_min;
    const max = row.numeric_max;
    if (min !== null && max !== null) {
      return { min, max };
    }
    return min ?? max;
  }
  if (row.text_value) return row.text_value;
  if (row.schedule_value) return row.schedule_value;
  return null;
}

export async function applyDescription(
  client: SupabaseClient<Database>,
  pubId: string,
  description: DescriptionResult,
  actor = "ai_enrichment"
) {
  const { data: existing, error: fetchError } = await client
    .from("pubs")
    .select("description")
    .eq("id", pubId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to load existing pub metadata: ${fetchError.message}`);
  }

  const beforeDescription = existing?.description ?? null;
  const updates = {
    description: description.summary,
  } satisfies Database["public"]["Tables"]["pubs"]["Update"];

  const { error } = await client.from("pubs").update(updates).eq("id", pubId);
  if (error) {
    throw new Error(`Failed to update pub description: ${error.message}`);
  }

  await client.from("pub_change_history").insert({
    pub_id: pubId,
    action: actor,
    before: beforeDescription !== null ? toJson({ description: beforeDescription }) : null,
    after: toJson({ description: description.summary, highlights: description.highlights }),
  });
}

function normaliseAttributeValue(value: unknown, dataType?: string): AttributeValueSnapshot | null {
  const base: AttributeValueSnapshot = {
    boolean_value: null,
    int_value: null,
    numeric_min: null,
    numeric_max: null,
    text_value: null,
    tags_value: null,
    schedule_value: null,
    rating_value: null,
  };

  switch (dataType) {
    case "boolean": {
      if (typeof value === "boolean") {
        return { ...base, boolean_value: value };
      }
      if (typeof value === "string") {
        const normalised = value.trim().toLowerCase();
        if (["true", "yes", "y", "1"].includes(normalised)) {
          return { ...base, boolean_value: true };
        }
        if (["false", "no", "n", "0"].includes(normalised)) {
          return { ...base, boolean_value: false };
        }
      }
      return null;
    }
    case "integer": {
      if (typeof value === "number" && Number.isFinite(value)) {
        return { ...base, int_value: Math.round(value) };
      }
      if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
        return { ...base, int_value: Math.round(Number(value)) };
      }
      return null;
    }
    case "integer_range": {
      if (typeof value === "object" && value !== null) {
        const candidate = value as Record<string, unknown>;
        const minRaw = candidate.min ?? candidate.from ?? candidate.start;
        const maxRaw = candidate.max ?? candidate.to ?? candidate.end;
        const min = typeof minRaw === "number" ? Math.round(minRaw) : null;
        const max = typeof maxRaw === "number" ? Math.round(maxRaw) : null;
        if (min !== null || max !== null) {
          return { ...base, numeric_min: min, numeric_max: max };
        }
      }
      if (Array.isArray(value)) {
        const [minRaw, maxRaw] = value;
        const min = typeof minRaw === "number" ? Math.round(minRaw) : null;
        const max = typeof maxRaw === "number" ? Math.round(maxRaw) : null;
        if (min !== null || max !== null) {
          return { ...base, numeric_min: min, numeric_max: max };
        }
      }
      if (typeof value === "number" && Number.isFinite(value)) {
        const rounded = Math.round(value);
        return { ...base, numeric_min: rounded, numeric_max: rounded };
      }
      if (typeof value === "string" && value.includes("-")) {
        const [maybeMin, maybeMax] = value.split("-").map((part) => Number(part.trim()));
        const min = Number.isFinite(maybeMin) ? Math.round(maybeMin) : null;
        const max = Number.isFinite(maybeMax) ? Math.round(maybeMax) : null;
        if (min !== null || max !== null) {
          return { ...base, numeric_min: min, numeric_max: max };
        }
      }
      return null;
    }
    case "rating": {
      if (typeof value === "number" && Number.isFinite(value)) {
        return { ...base, rating_value: value };
      }
      return null;
    }
    case "tag_set": {
      if (Array.isArray(value)) {
        const tags = value.map((item) => String(item).trim()).filter((item) => item.length > 0);
        if (tags.length === 0) return null;
        return { ...base, tags_value: tags };
      }
      if (typeof value === "string") {
        const tags = value
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
        if (tags.length === 0) return null;
        return { ...base, tags_value: tags };
      }
      return null;
    }
    case "text": {
      if (typeof value === "string" && value.trim().length > 0) {
        return { ...base, text_value: value.trim() };
      }
      return null;
    }
    case "schedule":
    case "json": {
      if (value && typeof value === "object") {
        return { ...base, schedule_value: value as Json };
      }
      return null;
    }
    default:
      break;
  }

  if (typeof value === "boolean") {
    return { ...base, boolean_value: value };
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return { ...base, numeric_min: value, numeric_max: value };
  }
  if (Array.isArray(value)) {
    const tags = value.map((item) => String(item).trim()).filter((item) => item.length > 0);
    if (tags.length === 0) return null;
    return { ...base, tags_value: tags };
  }
  if (value && typeof value === "object") {
    return { ...base, schedule_value: value as Json };
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return { ...base, text_value: value.trim() };
  }

  return null;
}

export async function applyAttributes(
  client: SupabaseClient<Database>,
  pubId: string,
  attributes: AttributeResult,
  actor = "ai_enrichment"
) {
  const entries = Object.entries(attributes.attributes);
  if (entries.length === 0) return;

  const { data: attributeIndex, error: lookupError } = await client
    .from("attributes")
    .select("id, code, data_type");

  if (lookupError) {
    throw new Error(`Failed to load attribute dictionary: ${lookupError.message}`);
  }

  const metadataByCode = new Map<string, { id: string; dataType: string | null }>();
  const codeById = new Map<string, string>();
  for (const row of attributeIndex ?? []) {
    metadataByCode.set(row.code, { id: row.id, dataType: row.data_type ?? null });
    codeById.set(row.id, row.code);
  }

  const timestamp = new Date().toISOString();

  const changes = entries
    .map(([code, value]) => {
      const metadata = metadataByCode.get(code);
      if (!metadata) return null;
      const normalised = normaliseAttributeValue(value, metadata.dataType ?? undefined);
      if (!normalised) return null;
      const canonicalValue = denormaliseAttributeValue(normalised);
      return {
        code,
        attribute_id: metadata.id,
        value: canonicalValue,
        payload: {
          pub_id: pubId,
          attribute_id: metadata.id,
          source: "ai_generated" as const,
          last_verified_at: timestamp,
          ...normalised,
        },
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (changes.length === 0) return;

  const payload = changes.map((change) => change.payload);
  const attributeIds = changes.map((change) => change.attribute_id);

  let beforeSnapshot: Record<string, unknown> | null = null;
  if (attributeIds.length > 0) {
    const { data: existingValues, error: existingError } = await client
      .from("pub_attribute_values")
      .select(
        "attribute_id, boolean_value, int_value, numeric_min, numeric_max, text_value, tags_value, schedule_value, rating_value",
      )
      .eq("pub_id", pubId)
      .in("attribute_id", attributeIds);

    if (existingError) {
      throw new Error(`Failed to load current attribute values: ${existingError.message}`);
    }

    if (existingValues && existingValues.length > 0) {
      beforeSnapshot = {};
      for (const row of existingValues) {
        const code = codeById.get(row.attribute_id) ?? row.attribute_id;
        beforeSnapshot[code] = denormaliseAttributeValue(row);
      }
    }
  }

  const { error } = await client.from("pub_attribute_values").upsert(payload, {
    onConflict: "pub_id,attribute_id",
  });

  if (error) {
    throw new Error(`Failed to upsert attribute values: ${error.message}`);
  }

  const afterSnapshot = Object.fromEntries(changes.map((change) => [change.code, change.value]));

  await client.from("pub_change_history").insert({
    pub_id: pubId,
    action: actor,
    before:
      beforeSnapshot && Object.keys(beforeSnapshot).length > 0
        ? toJson({ attributes: beforeSnapshot })
        : null,
    after: toJson({ attributes: afterSnapshot }),
  });
}

export async function applyEnrichment(
  client: SupabaseClient<Database>,
  pubId: string,
  result: EnrichmentResult,
  actor = "ai_enrichment"
) {
  if (typeof result.summary === "string") {
    const highlights = Array.isArray(result.highlights) ? result.highlights : [];
    await applyDescription(client, pubId, { summary: result.summary, highlights }, actor);
  }
  if (result.attributes) {
    await applyAttributes(client, pubId, { attributes: result.attributes }, actor);
  }
}
