import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { PubCard } from "@/components/pubs/pub-card";
import { getLocalityPageData, getPubDetail } from "@/lib/supabase/queries";

export const revalidate = 300;

const formatHours = (hours: Record<string, string> | null) => {
  if (!hours) return [];
  return Object.entries(hours).map(([day, slot]) => ({
    day: day.charAt(0).toUpperCase() + day.slice(1),
    slot,
  }));
};

const formatCost = (min: number | null, max: number | null) => {
  if (min && max) return `₹${min.toLocaleString()} – ₹${max.toLocaleString()}`;
  if (min) return `From ₹${min.toLocaleString()}`;
  if (max) return `Up to ₹${max.toLocaleString()}`;
  return "Not specified";
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const pub = await getPubDetail(params.slug);
  if (!pub) {
    return {
      title: "Pub not found",
      description: "This pub is not yet in our directory.",
    };
  }

  const title = `${pub.name} — Pub in Bangalore`;
  const description = pub.description
    ? pub.description
    : `${pub.name} listing with timings, maps, and pricing.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function PubDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const pub = await getPubDetail(params.slug);

  if (!pub) {
    notFound();
  }

  const hours = formatHours(pub.operating_hours_raw);
  const mapQuery = encodeURIComponent(`${pub.name} ${pub.locality_name ?? "Bengaluru"}`);
  const mapEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&output=embed`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    name: pub.name,
    url: `https://pubsinbangalore.com/pubs/${pub.slug}`,
    description: pub.description,
    telephone: pub.phone ?? undefined,
    aggregateRating: pub.average_rating
      ? {
          "@type": "AggregateRating",
          ratingValue: pub.average_rating,
          reviewCount: pub.review_count ?? 0,
        }
      : undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: pub.locality_name ?? pub.locality_slug?.replace(/-/g, " ") ?? "Bengaluru",
      addressRegion: "Karnataka",
      addressCountry: "IN",
    },
    priceRange:
      pub.cost_for_two_min && pub.cost_for_two_max
        ? `₹${pub.cost_for_two_min} - ₹${pub.cost_for_two_max}`
        : undefined,
    sameAs: pub.website_url ? [pub.website_url] : undefined,
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Does ${pub.name} have redeemable cover charges?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: pub.cover_charge_redeemable
            ? "Yes, cover charges can typically be redeemed against your bill."
            : "Cover charge policies vary. Call ahead to confirm redemption options.",
        },
      },
      {
        "@type": "Question",
        name: `What is the usual budget for two at ${pub.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text:
            pub.cost_for_two_min || pub.cost_for_two_max
              ? `Expect to spend around ${formatCost(pub.cost_for_two_min, pub.cost_for_two_max)}.`
              : "Budget information will appear once the owner updates pricing.",
        },
      },
    ],
  };

  const nearbyPubs = pub.locality_slug
    ? (
        await getLocalityPageData(pub.locality_slug, {
          limit: 6,
        })
      ).pubs
        .filter((candidate) => candidate.slug !== pub.slug)
        .slice(0, 3)
    : [];

  const highlightAttributes = pub.attributes
    .filter((attribute) => attribute.displayValue)
    .slice(0, 6);

  return (
    <div className="space-y-10">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
              Pub profile
            </p>
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{pub.name}</h1>
            {pub.locality_name && (
              <p className="text-sm uppercase tracking-wide text-slate-500">{pub.locality_name}</p>
            )}
            {pub.description && (
              <p className="max-w-2xl text-base text-slate-600">{pub.description}</p>
            )}
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              {pub.average_rating && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                  {pub.average_rating.toFixed(1)} ★ ({pub.review_count?.toLocaleString()} reviews)
                </span>
              )}
              <span className="rounded-full bg-slate-100 px-3 py-1 capitalize">
                Status: {pub.status.replace(/_/g, " ")}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                Cost for two: {formatCost(pub.cost_for_two_min, pub.cost_for_two_max)}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm text-slate-600">
            <Link
              href={pub.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2 font-semibold text-white transition hover:bg-emerald-700"
            >
              Open in Google Maps
            </Link>
            {pub.website_url && (
              <Link
                href={pub.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2 font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-600"
              >
                Visit website
              </Link>
            )}
            {pub.phone && <p className="text-sm">📞 {pub.phone}</p>}
          </div>
        </div>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Operating hours</h2>
          {hours.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">
              Hours not available. Owners can update this once they claim the listing.
            </p>
          ) : (
            <dl className="mt-4 space-y-2 text-sm text-slate-600">
              {hours.map((entry) => (
                <div key={entry.day} className="flex items-center justify-between">
                  <dt className="font-medium">{entry.day}</dt>
                  <dd>{entry.slot}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Entry & pricing</h2>
          <dl className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <dt className="font-medium">Cover charge</dt>
              <dd>
                {pub.cover_charge_min || pub.cover_charge_max
                  ? formatCost(pub.cover_charge_min, pub.cover_charge_max)
                  : "Venue announced"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-medium">Redeemable?</dt>
              <dd>{pub.cover_charge_redeemable ? "Yes" : "Check with venue"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-medium">Stag entry</dt>
              <dd>{pub.stag_entry_policy ?? "Call to confirm"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-medium">Couples entry</dt>
              <dd>{pub.couples_entry_policy ?? "Call to confirm"}</dd>
            </div>
            {pub.happy_hours_note && (
              <div className="flex items-center justify-between">
                <dt className="font-medium">Happy hours</dt>
                <dd>{pub.happy_hours_note}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      {highlightAttributes.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Highlights</h2>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
            {highlightAttributes.map((attribute) => (
              <span key={attribute.code} className="rounded-full bg-slate-100 px-3 py-1">
                {attribute.label}: {attribute.displayValue}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Plan your visit</h2>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-slate-600">
            <li>AI-generated highlights and FAQs will surface here in Phase 4.</li>
            <li>Claimed owners can manage cover charges, events, and badge embeds.</li>
            <li>Schema.org JSON-LD already prepared for search engines.</li>
          </ul>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
          <iframe
            src={mapEmbedUrl}
            title={`Map for ${pub.name}`}
            loading="lazy"
            className="h-64 w-full"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>

      {nearbyPubs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">More in {pub.locality_name ?? "Bangalore"}</h2>
            <Link
              href={`/pubs/in/${pub.locality_slug}`}
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View locality guide →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {nearbyPubs.map((nearby) => (
              <PubCard key={nearby.id} pub={nearby} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
