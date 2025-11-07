"use server";

import { parse } from "csv-parse/sync";
import { revalidatePath } from "next/cache";

import { applyEnrichment } from "@/lib/ai/apply";
import { coerceJobType } from "@/lib/ai/job-types";
import type { JobType } from "@/lib/ai/job-types";
import type { EnrichmentResult } from "@/lib/ai/types";
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

export async function enqueueAiJobAction(formData: FormData): Promise<void> {
  const pubId = formData.get("pubId") as string | null;
  const jobType = coerceJobType(formData.get("jobType"));

  if (!pubId) {
    console.error("AI job enqueue missing pubId");
    return;
  }

  const supabase = getServiceSupabaseClient();

  const { data: existing } = await supabase
    .from("ai_content_jobs")
    .select("id")
    .eq("pub_id", pubId)
    .eq("job_type", jobType)
    .eq("status", "pending")
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("ai_content_jobs").insert({
      pub_id: pubId,
      job_type: jobType,
      status: "pending",
      payload: null,
    });

    if (error) {
      console.error("Failed to enqueue AI job", error);
    }
  }

  revalidatePath(ADMIN_PATH);
}

export async function rerunAiJobAction(formData: FormData): Promise<void> {
  const jobId = formData.get("jobId") as string | null;
  if (!jobId) {
    console.error("AI job rerun missing jobId");
    return;
  }

  const supabase = getServiceSupabaseClient();

  const { error } = await supabase
    .from("ai_content_jobs")
    .update({
      status: "pending",
      error: null,
      output: null,
      completed_at: null,
      approved_by: null,
      approved_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) {
    console.error("Failed to queue AI job for rerun", error);
  }

  revalidatePath(ADMIN_PATH);
}

export async function moderateAiJobAction(formData: FormData): Promise<void> {
  const jobId = formData.get("jobId") as string | null;
  const intent = formData.get("intent") as "approve" | "reject" | null;
  const reason = (formData.get("reason") as string | null)?.trim() || null;

  if (!jobId || !intent) {
    console.error("AI moderation missing parameters.");
    return;
  }

  const supabase = getServiceSupabaseClient();
  const { data: job, error } = await supabase
    .from("ai_content_jobs")
    .select("id, pub_id, job_type, status, output")
    .eq("id", jobId)
    .maybeSingle();

  if (error || !job) {
    console.error("Failed to load AI job for moderation", error);
    return;
  }

  const now = new Date().toISOString();

  if (intent === "reject") {
    const rejectionPayload = { message: reason ?? "Rejected by moderator" } as Json;
    const { error: rejectError } = await supabase
      .from("ai_content_jobs")
      .update({
        status: "rejected",
        error: rejectionPayload,
        updated_at: now,
        approved_at: null,
        approved_by: null,
      })
      .eq("id", jobId);

    if (rejectError) {
      console.error("Failed to reject AI job", rejectError);
    }

    revalidatePath(ADMIN_PATH);
    return;
  }

  if (job.status !== "awaiting_review" && job.status !== "completed") {
    console.error(`AI job ${jobId} not ready for approval (status=${job.status}).`);
    return;
  }

  if (!job.output) {
    console.error(`AI job ${jobId} missing output payload.`);
    return;
  }

  const applicableTypes = new Set<JobType>(["description", "attributes", "full_enrichment"]);

  if (applicableTypes.has(job.job_type)) {
    try {
      const result = job.output as EnrichmentResult;
      await applyEnrichment(supabase, job.pub_id, result, "ai_enrichment_approved");
    } catch (applyError) {
      console.error("Failed to apply enrichment during approval", applyError);
      return;
    }
  }

  const { error: approveError } = await supabase
    .from("ai_content_jobs")
    .update({
      status: "approved",
      approved_at: now,
      updated_at: now,
    })
    .eq("id", jobId);

  if (approveError) {
    console.error("Failed to finalise AI job approval", approveError);
  }

  revalidatePath(ADMIN_PATH);
}
