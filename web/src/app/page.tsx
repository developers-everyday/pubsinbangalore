import Link from "next/link";
import { getServerSupabaseClient } from "@/lib/supabase/server";

interface LocalitySummary {
  id: string;
  name: string;
  slug: string;
}

async function fetchLocalities(): Promise<{
  localities: LocalitySummary[];
  error: string | null;
}> {
  const hasEnv =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasEnv) {
    return {
      localities: [],
      error: "Supabase environment variables are not configured yet.",
    };
  }

  try {
    const supabase = getServerSupabaseClient();
    const { data, error } = await supabase
      .from("localities")
      .select("id, name, slug")
      .order("name", { ascending: true })
      .limit(12);

    if (error) {
      return { localities: [], error: error.message };
    }

    return { localities: data ?? [], error: null };
  } catch (error) {
    return {
      localities: [],
      error: error instanceof Error ? error.message : "Unknown Supabase error",
    };
  }
}

export default async function Home() {
  const { localities, error } = await fetchLocalities();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-16 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
              PubsInBangalore · Technical Preview
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Data-enriched hub for Bangalore&apos;s bar scene
            </h1>
            <p className="text-lg text-slate-600">
              We are building a locality-first discovery experience powered by Supabase,
              AI enrichment, and SEO-friendly programmatic pages. Follow the build as we
              wire up ingestion pipelines, locality collections, and badge-ready pub listings.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="https://supabase.com/docs"
                className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Supabase Docs
              </Link>
              <Link
                href="https://nextjs.org/docs"
                className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Next.js Docs
              </Link>
            </div>
          </div>
          <div className="flex w-full max-w-sm flex-col gap-2 rounded-xl border border-slate-200 bg-slate-900/95 p-5 text-slate-100 shadow-lg">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
              Phase 1 checkpoints
            </h2>
            <ul className="space-y-2 text-sm leading-relaxed text-slate-200">
              <li>✅ TypeScript + Tailwind Next.js scaffold</li>
              <li>✅ Supabase client wiring with SSR helpers</li>
              <li>🛠️ CSV ingestion CLI (Python) ready for service-key writes</li>
              <li>🧭 Locality list auto-sync once Supabase keys are provided</li>
            </ul>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-16">
        <section className="grid gap-10 md:grid-cols-2">
          <article className="space-y-3">
            <h2 className="text-2xl font-semibold">Supabase-backed locality map</h2>
            <p className="text-base text-slate-600">
              Each neighbourhood page gets incremental static regeneration, locality-specific FAQs,
              and JSON-LD for SEO. Once the Supabase instance is connected, the overview below will
              populate automatically.
            </p>
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Localities snapshot
              </h3>
              {error ? (
                <p className="mt-4 text-sm text-amber-600">{error}</p>
              ) : localities.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  No localities available yet. Run the Supabase migrations and seed scripts to
                  see live data.
                </p>
              ) : (
                <ul className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  {localities.map((locality) => (
                    <li
                      key={locality.id}
                      className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
                    >
                      <span className="font-medium">{locality.name}</span>
                      <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-500">
                        /pubs/in/{locality.slug}
                      </code>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>

          <article className="space-y-3">
            <h2 className="text-2xl font-semibold">Ingestion + AI enrichment pipeline</h2>
            <p className="text-base text-slate-600">
              The `scripts/ingest_csv.py` tool validates raw scrape exports, deduplicates entries,
              and prepares JSON payloads for Supabase upserts. Phase 1 adds a TypeScript runner for
              idempotent writes with service-role keys.
            </p>
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Next steps checklist
              </h3>
              <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-slate-600">
                <li>Run database migrations from <code>../db/schema.sql</code>.</li>
                <li>Seed `attributes` and `localities` via Supabase SQL editor or CLI.</li>
                <li>
                  Configure environment: copy <code>.env.example</code> ➝ <code>.env.local</code> with Supabase keys.
                </li>
                <li>
                  Execute the Python ingestion dry run, then call the Node importer (coming soon) for upserts.
                </li>
              </ul>
            </div>
          </article>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-8">
          <h2 className="text-2xl font-semibold">Why this matters</h2>
          <p className="mt-4 text-base text-slate-600">
            By coupling a structured Supabase schema with AI-assisted enrichment, we can serve
            scenario-based queries like “rooftop pub with rock music under ₹1500” directly on
            locality pages. Structured JSON-LD and badge-driven backlinks amplify discoverability
            ahead of launch.
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PubsInBangalore. All rights reserved.</p>
          <Link
            href="https://github.com/supabase-community"
            className="text-slate-600 underline-offset-4 transition hover:text-slate-900 hover:underline"
          >
            Follow build updates
          </Link>
        </div>
      </footer>
    </div>
  );
}
