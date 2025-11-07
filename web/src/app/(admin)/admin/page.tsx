import Link from "next/link";

import {
  enqueueAiJobAction,
  moderateAiJobAction,
  processClaimAction,
  processCommunityReportAction,
  rerunAiJobAction,
  updatePubAction,
  uploadCsvAction,
} from "./actions";
import { getServiceSupabaseClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/types";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

type PubAttributeRow = {
  attribute_id: string;
  boolean_value: boolean | null;
  numeric_min: number | null;
  numeric_max: number | null;
  text_value: string | null;
  tags_value: string[] | null;
  schedule_value: Json | null;
  rating_value: number | null;
  attributes?: {
    code: string | null;
    label: string | null;
    data_type: string | null;
  } | null;
};

type ModerationJob = Database["public"]["Tables"]["ai_content_jobs"]["Row"] & {
  pubs?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    pub_attribute_values?: PubAttributeRow[] | null;
  } | null;
};

type ParsedJobOutput = {
  summary: string | null;
  highlights: string[];
  attributes: Record<string, unknown> | null;
};

const STATUS_META: Record<ModerationJob["status"], { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-slate-800 text-slate-300" },
  processing: { label: "Processing", className: "bg-slate-800 text-slate-300" },
  awaiting_review: { label: "Awaiting review", className: "bg-amber-500/20 text-amber-300" },
  approved: { label: "Approved", className: "bg-emerald-500/20 text-emerald-300" },
  rejected: { label: "Rejected", className: "bg-red-500/20 text-red-300" },
  failed: { label: "Failed", className: "bg-red-500/20 text-red-300" },
  completed: { label: "Completed", className: "bg-slate-800 text-slate-300" },
};

function parseEnrichmentOutput(output: Json | null): ParsedJobOutput {
  if (!output || typeof output !== "object") {
    return { summary: null, highlights: [], attributes: null };
  }

  const record = output as Record<string, unknown>;
  const summary = typeof record.summary === "string" ? record.summary : null;
  const highlights = Array.isArray(record.highlights)
    ? record.highlights.filter((item): item is string => typeof item === "string")
    : [];
  const attributes = record.attributes && typeof record.attributes === "object" && !Array.isArray(record.attributes)
    ? (record.attributes as Record<string, unknown>)
    : null;

  return { summary, highlights, attributes };
}

function normaliseValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normaliseValue(item));
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => [key, normaliseValue(val)]);
    return Object.fromEntries(entries);
  }
  return value;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(normaliseValue(a)) === JSON.stringify(normaliseValue(b));
}

function extractAttributeValue(row: PubAttributeRow): unknown {
  if (row.boolean_value !== null) return row.boolean_value;
  if (row.rating_value !== null) return row.rating_value;
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

function renderValue(value: unknown): ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-slate-500">—</span>;
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "number") {
    return value.toString();
  }
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : <span className="text-slate-500">—</span>;
  }
  return (
    <pre className="whitespace-pre-wrap break-words text-xs text-slate-300">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function formatJobType(jobType: ModerationJob["job_type"]): string {
  return jobType
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function statusBadge(status: ModerationJob["status"]): ReactNode {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function extractErrorMessage(error: Json | null): string | null {
  if (!error) return null;
  if (typeof error === "string") return error;
  if (typeof error === "object" && "message" in (error as Record<string, unknown>)) {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === "string") return message;
  }
  return JSON.stringify(error);
}


export default async function AdminDashboard() {
  try {
    const supabase = getServiceSupabaseClient();

    const [{ data: pubs }, { data: claims }, { data: reports }, { data: aiJobs }] = await Promise.all([
      supabase.from("pubs").select("id, name, slug").order("name").limit(100),
      supabase
        .from("pub_claims")
        .select("id, email, status, requested_at, pub_id, pubs:pub_id(id, name, slug)")
        .order("requested_at", { ascending: false })
        .limit(25),
      supabase
        .from("community_reports")
        .select("id, email, message, evidence_url, status, created_at, pub_id, pubs:pub_id(id, name, slug)")
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("ai_content_jobs")
        .select(
          `id, pub_id, job_type, status, output, error, created_at, updated_at, completed_at, approved_at, approved_by,
           pubs:pub_id(
             id, name, slug, description,
             pub_attribute_values(
               attribute_id,
               boolean_value,
               numeric_min,
               numeric_max,
               text_value,
               tags_value,
               schedule_value,
               rating_value,
               attributes(code, label, data_type)
             )
           )`
        )
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

    const moderationJobs = (aiJobs ?? []) as ModerationJob[];

    return (
      <div className="space-y-10">
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-inner">
          <h2 className="text-lg font-semibold text-white">CSV ingestion</h2>
          <p className="mt-2 text-sm text-slate-400">
            Validate and import new pubs or enrichment attributes. Dry run performs parsing + validation without
            writing to Supabase.
          </p>
          <form
            action={uploadCsvAction}
            className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-6"
            encType="multipart/form-data"
          >
            <label className="text-sm font-medium text-slate-200">
              Upload CSV
              <input
                type="file"
                name="csv"
                accept=".csv"
                className="mt-2 block w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                required
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="dryRun" defaultChecked className="h-4 w-4" /> Dry run only
            </label>
            <button
              type="submit"
              className="mt-2 inline-flex w-fit items-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
            >
              Process CSV
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-inner">
          <h2 className="text-lg font-semibold text-white">Manual pub update</h2>
          <p className="mt-2 text-sm text-slate-400">
            Quick edits for descriptions, cost ranges, and amenity toggles. Full attribute editing arrives with the
            Phase 3 admin dashboard.
          </p>
          <form action={updatePubAction} className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
            <label className="text-sm font-medium text-slate-200">
              Pub
              <select name="pubId" className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm">
                {pubs?.map((pub) => (
                  <option key={pub.id} value={pub.id}>
                    {pub.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-200">
              Description
              <textarea
                name="description"
                rows={3}
                className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                placeholder="Two-sentence summary"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-200">
                Cost for two (min)
                <input
                  type="number"
                  name="costMin"
                  className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                  placeholder="1500"
                />
              </label>
              <label className="text-sm font-medium text-slate-200">
                Cost for two (max)
                <input
                  type="number"
                  name="costMax"
                  className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                  placeholder="2500"
                />
              </label>
            </div>
            <label className="text-sm font-medium text-slate-200">
              Happy hours note
              <input
                type="text"
                name="happyHours"
                className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                placeholder="Buy 1 Get 1 on Wednesdays, 5–8pm"
              />
            </label>
            <div className="flex flex-wrap gap-4 text-sm text-slate-200">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="wifi" className="h-4 w-4" /> WiFi available
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="valet" className="h-4 w-4" /> Valet service
              </label>
            </div>
            <button
              type="submit"
              className="mt-2 inline-flex w-fit items-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
            >
              Save changes
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-inner">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-white">AI enrichment jobs</h2>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Phase 4 preview</p>
          </div>
          <form
            action={enqueueAiJobAction}
            className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 sm:grid-cols-[minmax(0,1fr)_160px_160px]"
          >
            <label className="flex flex-col text-sm text-slate-200">
              <span className="font-medium">Pub</span>
              <select
                name="pubId"
                className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                required
              >
                <option value="">Select a pub…</option>
                {pubs?.map((pub) => (
                  <option key={pub.id} value={pub.id}>
                    {pub.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm text-slate-200">
              <span className="font-medium">Job type</span>
              <select name="jobType" defaultValue="full_enrichment" className="mt-2 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm">
                <option value="full_enrichment">Full enrichment</option>
                <option value="description">Description only</option>
                <option value="attributes">Attributes only</option>
              </select>
            </label>
            <button
              type="submit"
              className="self-end rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
            >
              Enqueue job
            </button>
          </form>

          {moderationJobs.length > 0 ? (
            <div className="mt-6 space-y-4">
              {moderationJobs.map((job) => {
                const parsed = parseEnrichmentOutput(job.output);
                const currentDescription = job.pubs?.description ?? null;
                const summaryChanged = Boolean(
                  parsed.summary && parsed.summary.trim() !== (currentDescription ?? "").trim()
                );

                const existingAttributeMap = new Map<string, { label: string; value: unknown }>();
                (job.pubs?.pub_attribute_values ?? []).forEach((entry) => {
                  const code = entry.attributes?.code ?? null;
                  if (!code) return;
                  existingAttributeMap.set(code, {
                    label: entry.attributes?.label ?? code,
                    value: extractAttributeValue(entry),
                  });
                });

                const attributeDiffs = parsed.attributes
                  ? Object.entries(parsed.attributes)
                      .map(([code, nextValue]) => {
                        const existing = existingAttributeMap.get(code);
                        const currentValue = existing?.value ?? null;
                        if (valuesEqual(currentValue, nextValue)) {
                          return null;
                        }
                        return {
                          code,
                          label: existing?.label ?? code,
                          currentValue,
                          nextValue,
                        };
                      })
                      .filter((item): item is NonNullable<typeof item> => Boolean(item))
                  : [];

                const errorMessage = extractErrorMessage(job.error ?? null);

                return (
                  <div key={job.id} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-200">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">{formatJobType(job.job_type)}</p>
                        <p className="text-base font-semibold text-white">{job.pubs?.name ?? "Unknown pub"}</p>
                        <p className="text-xs text-slate-400">
                          Created {job.created_at ? new Date(job.created_at).toLocaleString() : "n/a"}
                          {job.completed_at ? ` • Completed ${new Date(job.completed_at).toLocaleString()}` : ""}
                          {job.approved_at ? ` • Approved ${new Date(job.approved_at).toLocaleString()}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        {statusBadge(job.status)}
                        {(job.status === "failed" ||
                          job.status === "rejected" ||
                          job.status === "approved" ||
                          job.status === "awaiting_review" ||
                          job.status === "completed") && (
                          <form action={rerunAiJobAction}>
                            <input type="hidden" name="jobId" value={job.id} />
                            <button
                              type="submit"
                              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                            >
                              Re-run job
                            </button>
                          </form>
                        )}
                      </div>
                    </div>

                    {(summaryChanged || attributeDiffs.length > 0 || parsed.highlights.length > 0 || errorMessage) && (
                      <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                        {summaryChanged && (
                          <div className="grid gap-3 sm:grid-cols-2 sm:gap-6">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-500">Current description</p>
                              <div className="mt-1 rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-300">
                                {renderValue(currentDescription)}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-500">Proposed summary</p>
                              <div className="mt-1 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-100">
                                {renderValue(parsed.summary)}
                              </div>
                            </div>
                          </div>
                        )}

                        {attributeDiffs.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Attribute changes</p>
                            <div className="space-y-3">
                              {attributeDiffs.map((diff) => (
                                <div key={diff.code} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                                  <p className="text-sm font-semibold text-white">{diff.label}</p>
                                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                                    <div>
                                      <p className="text-xs uppercase tracking-wide text-slate-500">Current</p>
                                      <div className="mt-1 text-sm text-slate-300">{renderValue(diff.currentValue)}</div>
                                    </div>
                                    <div>
                                      <p className="text-xs uppercase tracking-wide text-slate-500">Proposed</p>
                                      <div className="mt-1 text-sm text-emerald-100">{renderValue(diff.nextValue)}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {parsed.highlights.length > 0 && (
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Proposed highlights</p>
                            <ul className="mt-2 space-y-1 text-sm text-emerald-100">
                              {parsed.highlights.map((item, index) => (
                                <li
                                  key={`${job.id}-highlight-${index}`}
                                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2"
                                >
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {errorMessage && (
                          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                            {errorMessage}
                          </div>
                        )}
                      </div>
                    )}

                    {job.status === "awaiting_review" && (
                      <form
                        action={moderateAiJobAction}
                        className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3 sm:flex-row sm:items-center sm:gap-4"
                      >
                        <input type="hidden" name="jobId" value={job.id} />
                        <input
                          type="text"
                          name="reason"
                          placeholder="Rejection reason (optional)"
                          className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 sm:w-64"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="submit"
                            name="intent"
                            value="approve"
                            className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-emerald-950 transition hover:bg-emerald-400"
                          >
                            Approve &amp; publish
                          </button>
                          <button
                            type="submit"
                            name="intent"
                            value="reject"
                            className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-red-400 hover:text-red-300"
                          >
                            Reject
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">No AI jobs yet. Use the form above to enqueue enrichment.</p>
          )}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-inner">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-white">Ownership claims</h2>
            <Link href="/api/claims" className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Public claim endpoint →
            </Link>
          </div>
          {claims && claims.length > 0 ? (
            <div className="mt-4 space-y-4">
              {claims.map((claim) => (
                <form
                  key={claim.id}
                  action={processClaimAction}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-100">
                      {claim.pubs?.name ?? "Unknown pub"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {claim.email} • {claim.status} • {claim.requested_at ? new Date(claim.requested_at).toLocaleString() : "n/a"}
                    </p>
                    <input type="hidden" name="claimId" value={claim.id} />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      name="intent"
                      value="approve"
                      className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
                    >
                      Approve
                    </button>
                    <button
                      type="submit"
                      name="intent"
                      value="reject"
                      className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-red-400 hover:text-red-300"
                    >
                      Reject
                    </button>
                  </div>
                </form>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">No pending claims.</p>
          )}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-inner">
          <h2 className="text-lg font-semibold text-white">Community verification</h2>
          {reports && reports.length > 0 ? (
            <div className="mt-4 space-y-4">
              {reports.map((report) => (
                <form
                  key={report.id}
                  action={processCommunityReportAction}
                  className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-6"
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-slate-100">
                      {report.pubs?.name ?? "Unknown pub"}
                    </p>
                    <p className="text-xs text-slate-400">
                      Submitted {new Date(report.created_at).toLocaleString()} by {report.email ?? "anonymous"}
                    </p>
                    {report.message && (
                      <p className="text-sm text-slate-300">{report.message}</p>
                    )}
                    {report.evidence_url && (
                      <Link
                        href={report.evidence_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:text-emerald-300"
                      >
                        View evidence
                      </Link>
                    )}
                    <input type="hidden" name="reportId" value={report.id} />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      name="status"
                      value="approved"
                      className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
                    >
                      Mark valid
                    </button>
                    <button
                      type="submit"
                      name="status"
                      value="dismissed"
                      className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-red-400 hover:text-red-300"
                    >
                      Dismiss
                    </button>
                  </div>
                </form>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">No pending community reports.</p>
          )}
        </section>
      </div>
    );
  } catch (error) {
    return (
      <div className="rounded-3xl border border-dashed border-emerald-400/60 bg-slate-900 p-10 text-center shadow-inner">
        <h2 className="text-2xl font-semibold text-white">Admin setup incomplete</h2>
        <p className="mt-3 text-sm text-slate-300">
          {error instanceof Error ? error.message : "Supabase service role credentials missing."}
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-emerald-400">
          Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to unlock admin mode.
        </p>
      </div>
    );
  }
}
