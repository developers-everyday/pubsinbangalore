import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { PubCard } from "@/components/pubs/pub-card";
import { getLocalityPageData, getPubDetail } from "@/lib/supabase/queries";
import { PlatformRatings } from "@/components/pubs/platform-ratings";
import { ShareLinkSection } from "@/components/pubs/share-link-section";
import { VoteChips } from "@/components/pubs/vote-chips";
import type { VoteOption } from "@/components/pubs/vote-chips";
import { getCanonicalUrl } from "@/lib/utils/canonical";

export const revalidate = 300;

type OperatingHour = {
  day: string;
  shortDay: string;
  slot: string;
  isConfirmed: boolean;
};

const DAYS_OF_WEEK: Array<{ key: string; label: string; short: string }> = [
  { key: "monday", label: "Monday", short: "Mon" },
  { key: "tuesday", label: "Tuesday", short: "Tue" },
  { key: "wednesday", label: "Wednesday", short: "Wed" },
  { key: "thursday", label: "Thursday", short: "Thu" },
  { key: "friday", label: "Friday", short: "Fri" },
  { key: "saturday", label: "Saturday", short: "Sat" },
  { key: "sunday", label: "Sunday", short: "Sun" },
];

const DEFAULT_HOURS = "12:00 PM – 1:00 AM";

const formatOperatingHours = (hours: Record<string, string> | null): OperatingHour[] =>
  DAYS_OF_WEEK.map(({ key, label, short }) => {
    const slot = hours?.[key];
    return {
      day: label,
      shortDay: short,
      slot: slot ?? DEFAULT_HOURS,
      isConfirmed: Boolean(slot),
    };
  });

const inferBiasFromString = (value: string | null | undefined): "positive" | "negative" | "neutral" => {
  if (!value) return "neutral";
  const normalised = value.toLowerCase();
  if (normalised.includes("not") || normalised.includes("restricted")) return "negative";
  if (normalised.includes("allow") || normalised.includes("permitted")) return "positive";
  return "neutral";
};

const createBooleanVoteOptions = (
  positiveId: string,
  positiveLabel: string,
  negativeId: string,
  negativeLabel: string,
  bias: "positive" | "negative" | "neutral"
): VoteOption[] => {
  const positiveBase = bias === "positive" ? 32 : bias === "negative" ? 14 : 22;
  const negativeBase = bias === "positive" ? 12 : bias === "negative" ? 28 : 20;
  return [
    { id: positiveId, label: positiveLabel, count: positiveBase },
    { id: negativeId, label: negativeLabel, count: negativeBase },
  ];
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
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const pub = await getPubDetail(resolvedParams.slug);
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
    alternates: {
      canonical: getCanonicalUrl(`/pubs/${resolvedParams.slug}`),
    },
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
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const pub = await getPubDetail(resolvedParams.slug);

  if (!pub) {
    notFound();
  }

  const weeklyHours = formatOperatingHours(pub.operating_hours_raw as Record<string, string> | null);
  const storageKey = (suffix: string) => `vote:${pub.id ?? pub.slug}:${suffix}`;

  const stagBias = inferBiasFromString(pub.stag_entry_policy);
  const stagWeekendOptions = createBooleanVoteOptions(
    "stag-weekend-allowed",
    "Allowed",
    "stag-weekend-not-allowed",
    "Not allowed",
    stagBias
  );
  const stagWeekdayOptions = createBooleanVoteOptions(
    "stag-weekday-allowed",
    "Allowed",
    "stag-weekday-not-allowed",
    "Not allowed",
    stagBias
  );

  const coverBias = pub.cover_charge_min || pub.cover_charge_max ? "positive" : "negative";
  const coverOptions = createBooleanVoteOptions(
    "cover-present",
    "Cover charge",
    "cover-free",
    "No cover",
    coverBias as "positive" | "negative" | "neutral"
  );

  const redeemBias =
    pub.cover_charge_redeemable === true
      ? "positive"
      : pub.cover_charge_redeemable === false
      ? "negative"
      : "neutral";
  const redeemOptions = createBooleanVoteOptions(
    "cover-redeemable",
    "Redeemable",
    "cover-not-redeemable",
    "Not redeemable",
    redeemBias
  );
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
              {pub.overall_rating_average && (
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                  Overall: {pub.overall_rating_average.toFixed(1)} ★
                  {pub.overall_rating_min && pub.overall_rating_max && (
                    <span className="ml-1 text-xs font-normal">
                      ({pub.overall_rating_min.toFixed(1)}-{pub.overall_rating_max.toFixed(1)})
                    </span>
                  )}
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
            {pub.phone && (
              <a
                href={`tel:${pub.phone}`}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2 font-semibold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-50"
              >
                📞 Call {pub.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      {(pub.average_rating || pub.platform_ratings.length > 0) && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <PlatformRatings
            platformRatings={pub.platform_ratings}
            googleRating={pub.average_rating}
            googleReviewCount={pub.review_count}
            googleMapsUrl={pub.google_maps_url}
          />
        </section>
      )}

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
          <h2 className="text-lg font-semibold text-slate-900">Operating hours</h2>
          <dl className="mt-4 space-y-1 text-sm text-slate-600">
            {weeklyHours.map((entry) => (
              <div key={entry.day} className="flex items-center justify-between rounded-lg px-3 py-2">
                <dt className="font-medium text-slate-800">{entry.shortDay}</dt>
                <dd className={entry.isConfirmed ? "text-slate-800" : "italic text-slate-400"}>
                  {entry.slot}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Entry & pricing</h2>
          <div className="mt-4 space-y-6">
            <dl className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <dt className="font-medium">Cover charge</dt>
                <dd>
                  {pub.cover_charge_min || pub.cover_charge_max
                    ? formatCost(pub.cover_charge_min, pub.cover_charge_max)
                    : "Call ahead — cover changes nightly"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-medium">Redeemable?</dt>
                <dd>
                  {pub.cover_charge_redeemable === true
                    ? "Yes (recent reports)"
                    : pub.cover_charge_redeemable === false
                    ? "Usually not redeemable"
                    : "Depends on the night"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-medium">Stag entry</dt>
                <dd>{pub.stag_entry_policy ?? "Tap to crowd-source below"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-medium">Couples entry</dt>
                <dd>Allowed (default assumption)</dd>
              </div>
              {pub.happy_hours_note && (
                <div className="flex items-center justify-between">
                  <dt className="font-medium">Happy hours</dt>
                  <dd>{pub.happy_hours_note}</dd>
                </div>
              )}
            </dl>

            <div className="space-y-4">
              <VoteChips
                label="Stag entry · Weekends (Fri–Sun)"
                storageKey={storageKey("stag-weekend")}
                initialOptions={stagWeekendOptions}
                helperText="Tap once per session"
              />
              <VoteChips
                label="Stag entry · Weekdays (Mon–Thu)"
                storageKey={storageKey("stag-weekday")}
                initialOptions={stagWeekdayOptions}
                helperText="Tap once per session"
              />
              <VoteChips
                label="Cover charge vibe"
                storageKey={storageKey("cover-charge")}
                initialOptions={coverOptions}
                helperText="Community check-ins"
              />
              <VoteChips
                label="Cover is redeemable"
                storageKey={storageKey("cover-redeemable")}
                initialOptions={redeemOptions}
                helperText="Vote based on your visit"
              />
            </div>

            <p className="text-xs text-slate-500">
              House rules change often — call the pub before you head out to confirm cover and entry policies.
            </p>
          </div>
        </div>
      </section>

      {pub.overall_rating_details && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Overall Rating</h2>
          <p className="mt-2 text-sm text-slate-600">{pub.overall_rating_details}</p>
        </section>
      )}

      <ShareLinkSection
        pubName={pub.name}
        localityName={pub.locality_name}
        slug={pub.slug}
        description={pub.description}
        rating={pub.average_rating}
      />

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Plan your visit</h2>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-slate-600">
            <li>AI-generated highlights and FAQs will surface here in Phase 4.</li>
            <li>Claimed owners can manage cover charges, events, and share-ready promos.</li>
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
