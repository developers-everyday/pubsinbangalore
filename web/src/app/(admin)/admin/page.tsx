import Link from "next/link";

import {
  processClaimAction,
  processCommunityReportAction,
  updatePubAction,
  uploadCsvAction,
} from "./actions";
import { CsvDropzone } from "./csv-dropzone";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  try {
    const supabase = getServiceSupabaseClient();

    const [{ data: pubs }, { data: claims }, { data: reports }] = await Promise.all([
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
    ]);

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
              <div className="mt-3">
                <CsvDropzone />
              </div>
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
