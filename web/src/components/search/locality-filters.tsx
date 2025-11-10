"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export interface LocalityFilterState {
  budget: "any" | "under1500" | "1500-2500" | "2500-4000" | "4000plus";
  wifi: boolean;
  valet: boolean;
  coverRedeemable: boolean;
  sort: "rating_desc" | "rating_asc" | "reviews_desc" | "cost_desc" | "cost_asc";
}

interface LocalityFiltersProps {
  state: LocalityFilterState;
}

const budgetOptions: Array<{ value: LocalityFilterState["budget"]; label: string }> = [
  { value: "any", label: "Any budget" },
  { value: "under1500", label: "Under ₹1,500" },
  { value: "1500-2500", label: "₹1,500 – ₹2,500" },
  { value: "2500-4000", label: "₹2,500 – ₹4,000" },
  { value: "4000plus", label: "₹4,000+" },
];

const sortOptions: Array<{ value: LocalityFilterState["sort"]; label: string }> = [
  { value: "rating_desc", label: "Top rated" },
  { value: "reviews_desc", label: "Most reviewed" },
  { value: "cost_asc", label: "Budget friendly" },
  { value: "cost_desc", label: "Premium first" },
  { value: "rating_asc", label: "Rising stars" },
];

export function LocalityFilters({ state }: LocalityFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = (key: string, value: string | boolean | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === false || value === "any") {
      params.delete(key);
    } else {
      params.set(key, typeof value === "boolean" ? String(value) : value);
    }

    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  const handleClear = () => {
    const params = new URLSearchParams(searchParams.toString());
    ["budget", "wifi", "valet", "redeemable", "sort"].forEach((key) => params.delete(key));
    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
      <label className="flex items-center gap-2">
        <span className="text-slate-600">Budget</span>
        <select
          value={state.budget}
          onChange={(event) => updateParam("budget", event.target.value as LocalityFilterState["budget"])}
          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
          disabled={isPending}
        >
          {budgetOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-slate-600">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={state.wifi}
          onChange={(event) => updateParam("wifi", event.target.checked)}
          disabled={isPending}
        />
        WiFi
      </label>
      <label className="flex items-center gap-2 text-slate-600">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={state.valet}
          onChange={(event) => updateParam("valet", event.target.checked)}
          disabled={isPending}
        />
        Valet
      </label>
      <label className="flex items-center gap-2 text-slate-600">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={state.coverRedeemable}
          onChange={(event) => updateParam("redeemable", event.target.checked)}
          disabled={isPending}
        />
        Redeemable cover
      </label>

      <label className="flex items-center gap-2">
        <span className="text-slate-600">Sort</span>
        <select
          value={state.sort}
          onChange={(event) => updateParam("sort", event.target.value as LocalityFilterState["sort"])}
          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
          disabled={isPending}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={handleClear}
        className="ml-auto inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-emerald-300 hover:text-emerald-600"
        disabled={isPending}
      >
        Clear filters
      </button>
    </div>
  );
}
