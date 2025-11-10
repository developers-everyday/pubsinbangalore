import type { Metadata } from "next";
import Link from "next/link";

import { getLocalities } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "Bangalore Pub Directory",
  description:
    "Discover Bangalore pubs by locality, vibe, and budget with AI-enriched insights and transparent pricing.",
};

export default async function PubsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const localities = await getLocalities();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
          <div className="flex flex-col gap-2">
            <Link href="/" className="text-sm font-semibold text-emerald-600">
              ← Back to overview
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Bangalore Pubs Directory
            </h1>
            <p className="max-w-3xl text-base text-slate-600">
              Use the locality chips below or search to find rooftop microbreweries, live music nights, and
              late-night hangouts across the city. Data is powered by Supabase with AI enrichment arriving soon.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {localities.length === 0 ? (
              <span className="rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-500">
                Localities will appear once data is seeded.
              </span>
            ) : (
              localities.map((locality) => (
                <Link
                  key={locality.slug}
                  href={`/pubs/in/${locality.slug}`}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-400 hover:text-emerald-600"
                >
                  {locality.name}
                </Link>
              ))
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">{children}</main>
    </div>
  );
}
