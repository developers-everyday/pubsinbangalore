"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import type { PubSummary } from "@/lib/supabase/queries";
import { PubCard } from "@/components/pubs/pub-card";
import { LocalityFilters, type LocalityFilterState } from "./locality-filters";

const budgetOptionsMap: Record<LocalityFilterState["budget"], string> = {
  any: "Any budget",
  under1500: "Under ₹1,500",
  "1500-2500": "₹1,500 – ₹2,500",
  "2500-4000": "₹2,500 – ₹4,000",
  "4000plus": "₹4,000+",
};

const parseBudget = (
  value: string | null
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
  value: string | null
): LocalityFilterState["sort"] => {
  if (value === "rating_asc" || value === "reviews_desc" || value === "cost_desc" || value === "cost_asc") {
    return value;
  }
  return "rating_desc";
};

const sortPubs = (pubs: PubSummary[], sort: LocalityFilterState["sort"]) => {
  switch (sort) {
    case "rating_asc":
      return [...pubs].sort((a, b) => (a.average_rating ?? 0) - (b.average_rating ?? 0));
    case "reviews_desc":
      return [...pubs].sort((a, b) => (b.review_count ?? 0) - (a.review_count ?? 0));
    case "cost_asc":
      return [...pubs].sort(
        (a, b) => (a.cost_for_two_min ?? Number.MAX_SAFE_INTEGER) - (b.cost_for_two_min ?? Number.MAX_SAFE_INTEGER)
      );
    case "cost_desc":
      return [...pubs].sort((a, b) => (b.cost_for_two_max ?? 0) - (a.cost_for_two_max ?? 0));
    case "rating_desc":
    default:
      return [...pubs].sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0));
  }
};

const filterPubs = (
  pubs: PubSummary[],
  {
    searchQuery,
    minCost,
    maxCost,
    wifi,
    valet,
    coverRedeemable,
  }: {
    searchQuery: string | null;
    minCost?: number;
    maxCost?: number;
    wifi: boolean;
    valet: boolean;
    coverRedeemable: boolean;
  }
) => {
  return pubs
    .filter((pub) => {
      if (!searchQuery) return true;
      const value = searchQuery.toLowerCase();
      return pub.name.toLowerCase().includes(value) || (pub.description ?? "").toLowerCase().includes(value);
    })
    .filter((pub) => {
      if (typeof minCost !== "number") return true;
      const value = pub.cost_for_two_min ?? pub.cost_for_two_max;
      if (value === null || value === undefined) return false;
      return value >= minCost;
    })
    .filter((pub) => {
      if (typeof maxCost !== "number") return true;
      const value = pub.cost_for_two_max ?? pub.cost_for_two_min;
      if (value === null || value === undefined) return false;
      return value <= maxCost;
    })
    .filter((pub) => (wifi ? Boolean(pub.wifi_available) : true))
    .filter((pub) => (valet ? Boolean(pub.valet_available) : true))
    .filter((pub) => (coverRedeemable ? Boolean(pub.cover_charge_redeemable) : true));
};

interface LocalityResultsProps {
  localityName: string;
  pubs: PubSummary[];
}

export function LocalityResults({ localityName, pubs }: LocalityResultsProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q");
  const budget = parseBudget(searchParams.get("budget"));
  const sort = parseSort(searchParams.get("sort"));
  const filterState: LocalityFilterState = {
    budget: budget.bucket,
    wifi: searchParams.get("wifi") === "true",
    valet: searchParams.get("valet") === "true",
    coverRedeemable: searchParams.get("redeemable") === "true",
    sort,
  };

  const filteredPubs = useMemo(() => {
    const filtered = filterPubs(pubs, {
      searchQuery,
      minCost: budget.minCost,
      maxCost: budget.maxCost,
      wifi: filterState.wifi,
      valet: filterState.valet,
      coverRedeemable: filterState.coverRedeemable,
    });
    return sortPubs(filtered, filterState.sort);
  }, [
    budget.maxCost,
    budget.minCost,
    filterState.coverRedeemable,
    filterState.sort,
    filterState.valet,
    filterState.wifi,
    pubs,
    searchQuery,
  ]);

  const appliedFilters = useMemo(() => {
    const labels: string[] = [];
    if (filterState.budget !== "any") {
      const label = budgetOptionsMap[filterState.budget];
      if (label) labels.push(label);
    }
    if (filterState.wifi) labels.push("WiFi available");
    if (filterState.valet) labels.push("Valet service");
    if (filterState.coverRedeemable) labels.push("Redeemable cover");
    return labels;
  }, [filterState.budget, filterState.coverRedeemable, filterState.valet, filterState.wifi]);

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <LocalityFilters state={filterState} />
        {appliedFilters.length > 0 && (
          <p className="text-xs uppercase tracking-wide text-emerald-600">Active filters: {appliedFilters.join(" · ")}</p>
        )}
        {searchQuery && (
          <p className="text-sm text-slate-500">
            Showing results for <span className="font-semibold">&ldquo;{searchQuery}&rdquo;</span>
          </p>
        )}
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-slate-900">
          {filteredPubs.length} pub{filteredPubs.length === 1 ? "" : "s"} in {localityName}
        </h3>

        {filteredPubs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-100 p-8 text-sm text-slate-600">
            No pubs match the selected filters. Try clearing the filters or updating your search.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredPubs.map((pub) => (
              <PubCard key={pub.id} pub={pub} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

