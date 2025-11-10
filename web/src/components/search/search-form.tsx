"use client";

import { useCallback, useTransition, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface SearchFormProps {
  placeholder?: string;
}

export function SearchForm({ placeholder = "Search pubs" }: SearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(currentQuery);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setValue(currentQuery);
  }, [currentQuery]);

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams, value]
  );

  return (
    <form onSubmit={onSubmit} className="relative w-full max-w-xl">
      <input
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 pr-24 text-sm shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        disabled={isPending}
      >
        {isPending ? "Searching..." : "Search"}
      </button>
    </form>
  );
}
