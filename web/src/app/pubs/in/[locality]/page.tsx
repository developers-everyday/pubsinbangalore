import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { SearchForm } from "@/components/search/search-form";
import { LocalityFilters, type LocalityFilterState } from "@/components/search/locality-filters";
import { PubCard } from "@/components/pubs/pub-card";
import { getLocalities, getLocalityPageData } from "@/lib/supabase/queries";
import { getCanonicalUrl } from "@/lib/utils/canonical";

export const revalidate = 300;

const parseBudget = (
  value: string | undefined
): { bucket: LocalityFilterState["budget"]; minCost?: number; maxCost?: number } => {
  switch (value) {
    case "under1500":
      return { bucket: "under1500", minCost: undefined, maxCost: 1500 };
    case "1500-2500":
      return { bucket: "1500-2500", minCost: 1500, maxCost: 2500 };
    case "2500-4000":
      return { bucket: "2500-4000", minCost: 2500, maxCost: 4000 };
    case "4000plus":
      return { bucket: "4000plus", minCost: 4000, maxCost: undefined };
    default:
      return { bucket: "any" };
  }
};

const parseSort = (
  value: string | undefined
): LocalityFilterState["sort"] => {
  if (value === "rating_asc" || value === "reviews_desc" || value === "cost_desc" || value === "cost_asc") {
    return value;
  }
  return "rating_desc";
};

export async function generateStaticParams() {
  const localities = await getLocalities();
  return localities.slice(0, 10).map((locality) => ({ locality: locality.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locality: string }>;
  searchParams: Promise<{ q?: string; budget?: string; wifi?: string; valet?: string; redeemable?: string; sort?: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const budget = parseBudget(resolvedSearchParams.budget);
  const { locality: localityInfo } = await getLocalityPageData(resolvedParams.locality, {
    search: resolvedSearchParams.q,
    minCost: budget.minCost,
    maxCost: budget.maxCost,
    wifi: resolvedSearchParams.wifi === "true",
    valet: resolvedSearchParams.valet === "true",
    coverRedeemable: resolvedSearchParams.redeemable === "true",
    sort: parseSort(resolvedSearchParams.sort),
    limit: 12,
  });

  if (!localityInfo) {
    return {
      title: "Locality not found",
      description: "This Bangalore locality does not exist yet.",
    };
  }

  const title = `${localityInfo.name} pubs in Bangalore`;
  const description = `Discover pubs in ${localityInfo.name}, Bangalore with curated details on cover charges, cost for two, and live events.`;

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(`/pubs/in/${resolvedParams.locality}`),
    },
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function LocalityPage({
  params,
  searchParams,
}: {
  params: Promise<{ locality: string }>;
  searchParams: Promise<{
    q?: string;
    budget?: string;
    wifi?: string;
    valet?: string;
    redeemable?: string;
    sort?: string;
  }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const budget = parseBudget(resolvedSearchParams.budget);
  const sort = parseSort(resolvedSearchParams.sort);
  const filterState: LocalityFilterState = {
    budget: budget.bucket,
    wifi: resolvedSearchParams.wifi === "true",
    valet: resolvedSearchParams.valet === "true",
    coverRedeemable: resolvedSearchParams.redeemable === "true",
    sort,
  };

  const { locality, pubs } = await getLocalityPageData(resolvedParams.locality, {
    search: resolvedSearchParams.q,
    minCost: budget.minCost,
    maxCost: budget.maxCost,
    wifi: filterState.wifi,
    valet: filterState.valet,
    coverRedeemable: filterState.coverRedeemable,
    sort,
  });

  if (!locality) {
    notFound();
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${locality.name} pubs in Bangalore`,
    itemListElement: pubs.map((pub, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://pubsinbangalore.com/pubs/${pub.slug}`,
      name: pub.name,
    })),
  };

  const appliedFilters: string[] = [];
  if (filterState.budget !== "any") {
    const label = budgetOptionsMap[filterState.budget];
    if (label) appliedFilters.push(label);
  }
  if (filterState.wifi) appliedFilters.push("WiFi available");
  if (filterState.valet) appliedFilters.push("Valet service");
  if (filterState.coverRedeemable) appliedFilters.push("Redeemable cover");

  return (
    <div className="space-y-10">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <header className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
            Locality spotlight
          </p>
          <h2 className="text-3xl font-bold text-slate-900">
            Pubs in {locality.name}, {locality.city}
          </h2>
          <p className="max-w-3xl text-base text-slate-600">
            Discover rooftop breweries, live music nights, and late-night venues curated for {locality.name}.
            Use the filters below to narrow down by budget, entry perks, or amenities.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <SearchForm placeholder={`Search within ${locality.name}`} />
          <LocalityFilters state={filterState} />
          {appliedFilters.length > 0 && (
            <p className="text-xs uppercase tracking-wide text-emerald-600">
              Active filters: {appliedFilters.join(" · ")}
            </p>
          )}
          {resolvedSearchParams.q && (
            <p className="text-sm text-slate-500">
              Showing results for <span className="font-semibold">"{resolvedSearchParams.q}"</span>
            </p>
          )}
        </div>
      </header>

      <section className="space-y-6">
        <h3 className="text-xl font-semibold text-slate-900">
          {pubs.length} pub{pubs.length === 1 ? "" : "s"} in {locality.name}
        </h3>
        {pubs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-100 p-8 text-sm text-slate-600">
            No pubs yet. Seed the `pubs` table via the ingestion CLI to populate this page.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {pubs.map((pub) => (
              <PubCard key={pub.id} pub={pub} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const budgetOptionsMap: Record<LocalityFilterState["budget"], string> = {
  any: "Any budget",
  under1500: "Under ₹1,500",
  "1500-2500": "₹1,500 – ₹2,500",
  "2500-4000": "₹2,500 – ₹4,000",
  "4000plus": "₹4,000+",
};
