import { cache } from "react";
import { readFile } from "node:fs/promises";
import { resolve as resolvePath } from "node:path";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";
import { getServerSupabaseClient } from "./server";

export interface Locality {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
}

export interface PubAttribute {
  code: string;
  label: string;
  type: string;
  value: string | number | boolean | string[] | null;
  displayValue: string | null;
}

export interface PlatformRating {
  platform: string;
  rating: number;
  review_count: number | null;
  details: string | null;
  citation_source: string;
  citation_url: string;
  is_growing: boolean;
}

export interface PubSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  google_maps_url: string;
  website_url: string | null;
  average_rating: number | null;
  review_count: number | null;
  cost_for_two_min: number | null;
  cost_for_two_max: number | null;
  cover_charge_min: number | null;
  cover_charge_max: number | null;
  cover_charge_redeemable: boolean | null;
  wifi_available: boolean | null;
  valet_available: boolean | null;
  stag_entry_policy: string | null;
  couples_entry_policy: string | null;
  happy_hours_note: string | null;
  locality_slug: string | null;
  locality_name: string | null;
  attributeCodes?: string[];
}

export interface PubDetail extends PubSummary {
  phone: string | null;
  status: string;
  operating_hours_raw: Record<string, string> | null;
  attributes: PubAttribute[];
  platform_ratings: PlatformRating[];
  overall_rating_average: number | null;
  overall_rating_min: number | null;
  overall_rating_max: number | null;
  overall_rating_details: string | null;
}

export interface LocalityQueryOptions {
  search?: string;
  minCost?: number;
  maxCost?: number;
  wifi?: boolean;
  valet?: boolean;
  coverRedeemable?: boolean;
  sort?: "rating_desc" | "rating_asc" | "reviews_desc" | "cost_desc" | "cost_asc";
  limit?: number;
}

type SamplePub = {
  name: string;
  slug: string;
  description: string | null;
  google_maps_url: string;
  website_url: string | null;
  phone: string | null;
  status: string;
  average_rating: number | null;
  review_count: number | null;
  cost_for_two_min?: number | null;
  cost_for_two_max?: number | null;
  cover_charge_min?: number | null;
  cover_charge_max?: number | null;
  cover_charge_redeemable?: boolean | null;
  stag_entry_policy?: string | null;
  couples_entry_policy?: string | null;
  wheelchair_accessible?: boolean | null;
  wifi_available?: boolean | null;
  valet_available?: boolean | null;
  happy_hours_note?: string | null;
  operating_hours_raw: Record<string, string> | null;
  locality_slug: string | null;
};

type SamplePayload = {
  summary: {
    input_rows: number;
    post_dedupe: number;
    imported: number;
    skipped: number;
    timestamp: string;
  };
  imported: SamplePub[];
};

const DEFAULT_OPTIONS: Required<Pick<LocalityQueryOptions, "sort" | "limit">> = {
  sort: "rating_desc",
  limit: 60,
};

const hasSupabaseConfig = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const loadSampleData = cache(async (): Promise<SamplePayload | null> => {
  try {
    const filePath = resolvePath(process.cwd(), "data/sample-pubs.json");
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content) as SamplePayload;
  } catch (error) {
    console.warn("Sample data unavailable", error);
    return null;
  }
});

const mapPubRow = (row: Database["public"]["Tables"]["pubs"]["Row"]): PubSummary => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  google_maps_url: row.google_maps_url,
  website_url: row.website_url,
  average_rating: row.average_rating,
  review_count: row.review_count,
  cost_for_two_min: row.cost_for_two_min,
  cost_for_two_max: row.cost_for_two_max,
  cover_charge_min: row.cover_charge_min,
  cover_charge_max: row.cover_charge_max,
  cover_charge_redeemable: row.cover_charge_redeemable,
  wifi_available: row.wifi_available,
  valet_available: row.valet_available,
  stag_entry_policy: row.stag_entry_policy,
  couples_entry_policy: row.couples_entry_policy,
  happy_hours_note: row.happy_hours_note,
  locality_slug: null,
  locality_name: null,
});

const withLocalityMetadata = (pub: PubSummary, locality: Pick<Locality, "slug" | "name"> | null): PubSummary => ({
  ...pub,
  locality_slug: locality?.slug ?? null,
  locality_name: locality?.name ?? null,
});

const serialiseAttributeValue = (value: PubAttribute["value"], type: string): string | null => {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : null;
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "number") {
    if (type === "rating") {
      return `${value}/5`;
    }
    return value.toString();
  }
  return value;
};

const applyFiltersToQuery = (
  query: ReturnType<SupabaseClient<Database>["from"]>,
  options: LocalityQueryOptions | undefined
) => {
  let next = query;
  if (!options) {
    return next;
  }

  if (options.search) {
    const searchTerm = options.search.trim();
    if (searchTerm.length > 0) {
      const escaped = searchTerm.replace(/%/g, "\\%").replace(/_/g, "\\_");
      next = next.or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%`);
    }
  }
  if (typeof options.minCost === "number") {
    next = next.gte("cost_for_two_min", options.minCost);
  }
  if (typeof options.maxCost === "number") {
    next = next.lte("cost_for_two_max", options.maxCost);
  }
  if (options.wifi) {
    next = next.eq("wifi_available", true);
  }
  if (options.valet) {
    next = next.eq("valet_available", true);
  }
  if (options.coverRedeemable) {
    next = next.eq("cover_charge_redeemable", true);
  }

  const sort = options.sort ?? DEFAULT_OPTIONS.sort;
  switch (sort) {
    case "rating_asc":
      next = next.order("average_rating", { ascending: true, nullsLast: true });
      break;
    case "reviews_desc":
      next = next.order("review_count", { ascending: false, nullsLast: true });
      break;
    case "cost_asc":
      next = next.order("cost_for_two_min", { ascending: true, nullsLast: true });
      break;
    case "cost_desc":
      next = next.order("cost_for_two_max", { ascending: false, nullsLast: true });
      break;
    case "rating_desc":
    default:
      next = next.order("average_rating", { ascending: false, nullsLast: true });
      break;
  }

  return next;
};

async function fetchPubsForLocality(
  client: SupabaseClient<Database>,
  locality: Locality,
  options?: LocalityQueryOptions
) {
  const limit = options?.limit ?? DEFAULT_OPTIONS.limit;
  let query = client
    .from("pubs")
    .select(
      `*, pub_localities!inner(locality_id, is_primary),
       pub_attribute_values!left(
         boolean_value,
         attributes!inner(code)
       )`
    )
    .eq("pub_localities.locality_id", locality.id)
    .eq("pub_localities.is_primary", true)
    .limit(limit);

  query = applyFiltersToQuery(query, options);

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const pub = withLocalityMetadata(mapPubRow(row), locality);
    // Extract attribute codes for display (only boolean attributes that are true)
    const attributeCodes: string[] = [];
    if (row.pub_attribute_values && Array.isArray(row.pub_attribute_values)) {
      row.pub_attribute_values.forEach((av: any) => {
        if (av.attributes?.code && av.boolean_value === true) {
          attributeCodes.push(av.attributes.code);
        }
      });
    }
    return { ...pub, attributeCodes };
  });
}

export const getLocalities = cache(async (): Promise<Locality[]> => {
  if (hasSupabaseConfig()) {
    try {
      const client = getServerSupabaseClient();
      const { data, error } = await client
        .from("localities")
        .select("id, name, slug, city, state")
        .order("name")
        .limit(100);

      if (error) {
        throw new Error(error.message);
      }

      return (
        data ?? []
      ).map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        city: row.city,
        state: row.state,
      }));
    } catch (error) {
      console.warn("Supabase localities fetch failed, using sample data", error);
    }
  }

  const sample = await loadSampleData();
  if (!sample) return [];
  const seen = new Map<string, Locality>();
  for (const entry of sample.imported) {
    if (!entry.locality_slug) continue;
    if (!seen.has(entry.locality_slug)) {
      const name = entry.locality_slug
        .split("-")
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" ");
      seen.set(entry.locality_slug, {
        id: entry.locality_slug,
        name,
        slug: entry.locality_slug,
        city: "Bengaluru",
        state: "Karnataka",
      });
    }
  }
  return Array.from(seen.values());
});

export async function getLocalityPageData(
  localitySlug: string,
  options?: LocalityQueryOptions
) {
  const mergedOptions: LocalityQueryOptions = {
    ...options,
    sort: options?.sort ?? DEFAULT_OPTIONS.sort,
    limit: options?.limit ?? DEFAULT_OPTIONS.limit,
  };

  if (hasSupabaseConfig()) {
    try {
      const client = getServerSupabaseClient();
      const { data: locality, error } = await client
        .from("localities")
        .select("id, name, slug, city, state")
        .eq("slug", localitySlug)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!locality) {
        return { locality: null as Locality | null, pubs: [] as PubSummary[] };
      }

      const pubs = await fetchPubsForLocality(client, locality, mergedOptions);
      return { locality, pubs };
    } catch (error) {
      console.warn("Supabase locality page fallback", error);
    }
  }

  const sample = await loadSampleData();
  if (!sample) {
    return { locality: null as Locality | null, pubs: [] as PubSummary[] };
  }

  const localityName = localitySlug
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
  const locality: Locality = {
    id: localitySlug,
    name: localityName,
    slug: localitySlug,
    city: "Bengaluru",
    state: "Karnataka",
  };

  const pubs = sample.imported
    .filter((pub) => pub.locality_slug === localitySlug)
    .filter((pub) => {
      if (!mergedOptions.search) return true;
      const searchTerm = mergedOptions.search.toLowerCase();
      return pub.name.toLowerCase().includes(searchTerm) || (pub.description ?? "").toLowerCase().includes(searchTerm);
    })
    .filter((pub) => {
      if (typeof mergedOptions.minCost === "number") {
        const value = pub.cost_for_two_min ?? pub.cost_for_two_max;
        if (value === null || value === undefined) return false;
        if (value < mergedOptions.minCost) return false;
      }
      return true;
    })
    .filter((pub) => {
      if (typeof mergedOptions.maxCost === "number") {
        const value = pub.cost_for_two_max ?? pub.cost_for_two_min;
        if (value === null || value === undefined) return false;
        if (value > mergedOptions.maxCost) return false;
      }
      return true;
    })
    .filter((pub) => (mergedOptions.wifi ? Boolean(pub.wifi_available) : true))
    .filter((pub) => (mergedOptions.valet ? Boolean(pub.valet_available) : true))
    .filter((pub) => (mergedOptions.coverRedeemable ? Boolean(pub.cover_charge_redeemable) : true))
    .map<PubSummary>((pub, index) => ({
      id: `${pub.slug}-${index}`,
      name: pub.name,
      slug: pub.slug,
      description: pub.description,
      google_maps_url: pub.google_maps_url,
      website_url: pub.website_url,
      average_rating: pub.average_rating,
      review_count: pub.review_count,
      cost_for_two_min: pub.cost_for_two_min ?? null,
      cost_for_two_max: pub.cost_for_two_max ?? null,
      cover_charge_min: pub.cover_charge_min ?? null,
      cover_charge_max: pub.cover_charge_max ?? null,
      cover_charge_redeemable: pub.cover_charge_redeemable ?? null,
      wifi_available: pub.wifi_available ?? null,
      valet_available: pub.valet_available ?? null,
      stag_entry_policy: pub.stag_entry_policy ?? null,
      couples_entry_policy: pub.couples_entry_policy ?? null,
      happy_hours_note: pub.happy_hours_note ?? null,
      locality_slug: locality.slug,
      locality_name: locality.name,
      attributeCodes: [],
    }));

  const sorted = pubs.sort((a, b) => {
    switch (mergedOptions.sort) {
      case "rating_asc":
        return (a.average_rating ?? 0) - (b.average_rating ?? 0);
      case "reviews_desc":
        return (b.review_count ?? 0) - (a.review_count ?? 0);
      case "cost_asc":
        return (a.cost_for_two_min ?? Number.MAX_SAFE_INTEGER) - (b.cost_for_two_min ?? Number.MAX_SAFE_INTEGER);
      case "cost_desc":
        return (b.cost_for_two_max ?? 0) - (a.cost_for_two_max ?? 0);
      case "rating_desc":
      default:
        return (b.average_rating ?? 0) - (a.average_rating ?? 0);
    }
  });

  return {
    locality,
    pubs: sorted.slice(0, mergedOptions.limit ?? DEFAULT_OPTIONS.limit),
  };
}

export async function getPubDetail(slug: string): Promise<PubDetail | null> {
  if (hasSupabaseConfig()) {
    try {
      const client = getServerSupabaseClient();
      const { data, error } = await client
        .from("pubs")
        .select(
          `id, name, slug, description, google_maps_url, website_url, phone,
           status, average_rating, review_count, cost_for_two_min, cost_for_two_max,
           cover_charge_min, cover_charge_max, cover_charge_redeemable, wifi_available,
           valet_available, stag_entry_policy, couples_entry_policy, happy_hours_note,
           operating_hours_raw, overall_rating_average, overall_rating_min, overall_rating_max,
           overall_rating_details, ratings_last_synced_at,
           pub_localities(locality_id, localities(name, slug, city, state)),
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
           ),
           pub_platform_ratings(
             platform,
             rating,
             review_count,
             details,
             citation_source,
             citation_url,
             is_growing
           )`
        )
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) return null;

      const localitySlug = data.pub_localities?.[0]?.localities?.slug ?? null;
      const localityName = data.pub_localities?.[0]?.localities?.name ?? null;

      const attributes: PubAttribute[] = (data.pub_attribute_values ?? [])
        .map((entry) => {
          const attributeMeta = entry.attributes;
          if (!attributeMeta?.code) return null;

          let value: PubAttribute["value"] = null;
          let displayValue: string | null = null;

          if (entry.boolean_value !== null) {
            value = entry.boolean_value;
            displayValue = entry.boolean_value ? "Yes" : "No";
          } else if (entry.rating_value !== null) {
            value = entry.rating_value;
            displayValue = `${entry.rating_value}/5`;
          } else if (entry.tags_value && entry.tags_value.length > 0) {
            value = entry.tags_value;
            displayValue = entry.tags_value.join(", ");
          } else if (entry.numeric_min !== null || entry.numeric_max !== null) {
            const min = entry.numeric_min ?? entry.numeric_max;
            const max = entry.numeric_max ?? entry.numeric_min;
            value = min ?? max;
            if (min && max && min !== max) {
              displayValue = `${min} – ${max}`;
            } else {
              displayValue = (min ?? max)?.toString() ?? null;
            }
          } else if (entry.text_value) {
            value = entry.text_value;
            displayValue = entry.text_value;
          } else if (entry.int_value !== null) {
            value = entry.int_value;
            displayValue = entry.int_value.toString();
          } else if (entry.schedule_value) {
            value = JSON.stringify(entry.schedule_value);
            displayValue = "See schedule";
          }

          return {
            code: attributeMeta.code,
            label: attributeMeta.label ?? attributeMeta.code,
            type: attributeMeta.data_type ?? "text",
            value,
            displayValue: displayValue ?? serialiseAttributeValue(value, attributeMeta.data_type ?? "text"),
          } satisfies PubAttribute;
        })
        .filter((item): item is PubAttribute => Boolean(item));

      const platformRatings: PlatformRating[] = (data.pub_platform_ratings ?? []).map((pr) => ({
        platform: pr.platform,
        rating: pr.rating,
        review_count: pr.review_count,
        details: pr.details,
        citation_source: pr.citation_source,
        citation_url: pr.citation_url,
        is_growing: pr.is_growing,
      }));

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
        locality_slug: localitySlug,
        locality_name: localityName,
        operating_hours_raw: (data.operating_hours_raw as Record<string, string> | null) ?? null,
        attributes,
        platform_ratings: platformRatings,
        overall_rating_average: data.overall_rating_average ?? null,
        overall_rating_min: data.overall_rating_min ?? null,
        overall_rating_max: data.overall_rating_max ?? null,
        overall_rating_details: data.overall_rating_details ?? null,
      };
    } catch (error) {
      console.warn("Supabase pub detail fallback", error);
    }
  }

  const sample = await loadSampleData();
  const match = sample?.imported.find((pub) => pub.slug === slug);
  if (!match) return null;

  const localityName = match.locality_slug
    ? match.locality_slug
        .split("-")
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" ")
    : null;

  return {
    id: match.slug,
    name: match.name,
    slug: match.slug,
    description: match.description,
    google_maps_url: match.google_maps_url,
    website_url: match.website_url,
    phone: match.phone,
    status: match.status,
    average_rating: match.average_rating,
    review_count: match.review_count,
    cost_for_two_min: match.cost_for_two_min ?? null,
    cost_for_two_max: match.cost_for_two_max ?? null,
    cover_charge_min: match.cover_charge_min ?? null,
    cover_charge_max: match.cover_charge_max ?? null,
    cover_charge_redeemable: match.cover_charge_redeemable ?? null,
    wifi_available: match.wifi_available ?? null,
    valet_available: match.valet_available ?? null,
    stag_entry_policy: match.stag_entry_policy ?? null,
    couples_entry_policy: match.couples_entry_policy ?? null,
    happy_hours_note: match.happy_hours_note ?? null,
    locality_slug: match.locality_slug,
    locality_name: localityName,
    operating_hours_raw: match.operating_hours_raw,
    attributes: [],
    platform_ratings: [],
    overall_rating_average: null,
    overall_rating_min: null,
    overall_rating_max: null,
    overall_rating_details: null,
  };
}

export async function searchPubs(
  query: string,
  options?: { localitySlug?: string; limit?: number }
): Promise<PubSummary[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (options?.localitySlug) {
    const { pubs } = await getLocalityPageData(options.localitySlug, {
      search: trimmed,
      limit: options.limit ?? 10,
    });
    return pubs;
  }

  const localities = await getLocalities();
  const limit = options?.limit ?? 10;
  const aggregated: PubSummary[] = [];

  for (const locality of localities) {
    if (aggregated.length >= limit) break;
    const { pubs } = await getLocalityPageData(locality.slug, {
      search: trimmed,
      limit,
    });
    aggregated.push(
      ...pubs.filter((pub) => !aggregated.some((existing) => existing.slug === pub.slug))
    );
  }

  return aggregated.slice(0, limit);
}
