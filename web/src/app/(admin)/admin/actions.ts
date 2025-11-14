"use server";

import { parse } from "csv-parse/sync";
import { revalidatePath } from "next/cache";

import type { Database, Json } from "@/lib/supabase/types";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

const ADMIN_PATH = "/(admin)/admin";

export async function uploadCsvAction(formData: FormData): Promise<void> {
  const file = formData.get("csv") as File | null;
  const dryRun = formData.get("dryRun") === "on";

  if (!file) {
    console.error("CSV upload attempted without a file.");
    return;
  }

  const supabase = getServiceSupabaseClient();
  const contents = await file.text();

  const rows = parse(contents, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<Record<string, string>>;

  const mapped: Database["public"]["Tables"]["pubs"]["Insert"][] = rows.map((row) => ({
    name: row.name,
    slug: row.slug ?? row.name?.toLowerCase().replace(/\s+/g, "-") ?? crypto.randomUUID(),
    description: row.description ?? null,
    google_maps_url: row.location_link ?? row.google_maps_url,
    website_url: row.site ?? row.website_url ?? null,
    phone: row.phone ?? null,
    status: (row.business_status ?? "operational").toLowerCase(),
    average_rating: row.rating ? Number(row.rating) : null,
    review_count: row.reviews ? Number(row.reviews) : null,
    cost_for_two_min: row.cost_for_two_min ? Number(row.cost_for_two_min) : null,
    cost_for_two_max: row.cost_for_two_max ? Number(row.cost_for_two_max) : null,
    cover_charge_min: row.cover_charge_min ? Number(row.cover_charge_min) : null,
    cover_charge_max: row.cover_charge_max ? Number(row.cover_charge_max) : null,
    operating_hours_raw: row.working_hours ? (JSON.parse(row.working_hours) as Json) : null,
  }));

  if (dryRun) {
    console.info(`[dry-run] Validated ${mapped.length} CSV rows.`);
    return;
  }

  const { error } = await supabase.from("pubs").upsert(mapped, {
    onConflict: "slug",
  });

  if (error) {
    console.error("Supabase upsert error", error);
    return;
  }

  console.info(`Imported ${mapped.length} pubs via admin CSV upload.`);
  revalidatePath(ADMIN_PATH);
}

export async function updatePubAction(formData: FormData): Promise<void> {
  const pubId = formData.get("pubId") as string | null;
  if (!pubId) {
    console.error("Pub update missing pubId.");
    return;
  }

  const payload: Database["public"]["Tables"]["pubs"]["Update"] = {
    description: (formData.get("description") as string) || null,
    cost_for_two_min: formData.get("costMin") ? Number(formData.get("costMin")) : null,
    cost_for_two_max: formData.get("costMax") ? Number(formData.get("costMax")) : null,
    happy_hours_note: (formData.get("happyHours") as string) || null,
    wifi_available: formData.get("wifi") === "on",
    valet_available: formData.get("valet") === "on",
  };

  const supabase = getServiceSupabaseClient();
  const { error } = await supabase.from("pubs").update(payload).eq("id", pubId);

  if (error) {
    console.error("Supabase update error", error);
    return;
  }

  await supabase.from("pub_change_history").insert({
    pub_id: pubId,
    action: "manual_update",
    after: payload as Json,
  });

  revalidatePath(ADMIN_PATH);
}

export async function processClaimAction(formData: FormData): Promise<void> {
  const claimId = formData.get("claimId") as string | null;
  const intent = formData.get("intent") as "approve" | "reject" | null;

  if (!claimId || !intent) {
    console.error("Claim action missing parameters.");
    return;
  }

  const supabase = getServiceSupabaseClient();

  if (intent === "approve") {
    const { error } = await supabase
      .from("pub_claims")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", claimId);
    if (error) {
      console.error("Approve claim error", error);
      return;
    }
  } else {
    const { error } = await supabase
      .from("pub_claims")
      .update({ status: "rejected", rejected_at: new Date().toISOString() })
      .eq("id", claimId);
    if (error) {
      console.error("Reject claim error", error);
      return;
    }
  }

  revalidatePath(ADMIN_PATH);
}

export async function processCommunityReportAction(formData: FormData): Promise<void> {
  const reportId = formData.get("reportId") as string | null;
  const status = formData.get("status") as string | null;

  if (!reportId || !status) {
    console.error("Community report action missing parameters.");
    return;
  }

  const supabase = getServiceSupabaseClient();
  const { error } = await supabase
    .from("community_reports")
    .update({ status, resolved_at: new Date().toISOString() })
    .eq("id", reportId);

  if (error) {
    console.error("Community report update error", error);
    return;
  }

  revalidatePath(ADMIN_PATH);
}

