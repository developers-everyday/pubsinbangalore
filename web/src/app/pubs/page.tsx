import Link from "next/link";

import { getLocalities, getLocalityPageData } from "@/lib/supabase/queries";
import { PubCard } from "@/components/pubs/pub-card";

export const revalidate = 300;

export default async function PubsIndexPage() {
  const localities = await getLocalities();

  let featuredLocality: Awaited<ReturnType<typeof getLocalityPageData>>["locality"] = null;
  let featuredPubs: Awaited<ReturnType<typeof getLocalityPageData>>["pubs"] = [];

  if (localities.length > 0) {
    const localityData = await getLocalityPageData(localities[0].slug);
    featuredLocality = localityData.locality;
    featuredPubs = localityData.pubs;
  }

  return (
    <section className="space-y-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Start exploring</h2>
        <p className="mt-3 max-w-3xl text-base text-slate-600">
          Pick a neighbourhood to explore curated pub lists, AI-generated FAQs, and insider tips. New data drops
          every week as owners claim their listings and the enrichment pipeline goes live.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {localities.map((locality) => (
            <Link
              key={locality.slug}
              href={`/pubs/in/${locality.slug}`}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-400 hover:text-emerald-600"
            >
              {locality.name}
            </Link>
          ))}
          {localities.length === 0 && (
            <span className="text-sm text-slate-500">
              Seed the `localities` table or rely on sample data included in `data/sample-pubs.json`.
            </span>
          )}
        </div>
      </div>

      {featuredLocality && featuredPubs.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">
              Trending in {featuredLocality.name}
            </h3>
            <Link
              href={`/pubs/in/${featuredLocality.slug}`}
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {featuredPubs.slice(0, 4).map((pub) => (
              <PubCard key={pub.id} pub={pub} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
