import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { PubCard } from "@/components/pubs/pub-card";
import { getPubDetail } from "@/lib/supabase/queries";
import { PlatformRatings } from "@/components/pubs/platform-ratings";
import { ShareLinkSection } from "@/components/pubs/share-link-section";
import { getCanonicalUrl } from "@/lib/utils/canonical";
import { OperatingHoursCard } from "@/components/pubs/operating-hours-card";
import { VotingPanel } from "@/components/pubs/voting-panel";
import { canUseVoteBackend } from "@/lib/supabase/votes";
import { DEFAULT_VOTE_TOPICS } from "@/lib/votes/schema";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { NearbyPubs } from "@/components/pubs/nearby-pubs";

export const revalidate = 21600;
export const dynamic = "force-static";

export async function generateStaticParams() {
  const { getServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = getServerSupabaseClient();

  const { data: pubs } = await supabase
    .from("pubs")
    .select("slug")
    .eq("status", "operational")
    .order("review_count", { ascending: false })
    .limit(100);

  return pubs?.map((pub) => ({ slug: pub.slug })) ?? [];
}

type TimeRange = {
  open: string;
  close: string;
  servingUntil?: string;
};

type ScheduleData = Record<number, TimeRange[]>;

const DAYS_OF_WEEK_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const DEFAULT_HOURS = "12:00 PM – 1:00 AM";

/**
 * Transforms operating hours from database format to component format
 * From: { monday: "12:00 PM – 1:00 AM", ... }
 * To: { 0: [{ open: "12:00 PM", close: "1:00 AM" }], ... } where 0=Sunday, 1=Monday, etc.
 */
const transformOperatingHours = (hours: Record<string, string> | null): ScheduleData => {
  const schedule: ScheduleData = {};
  
  // Initialize all days with default hours
  for (let i = 0; i < 7; i++) {
    const [open, close] = DEFAULT_HOURS.split(" – ");
    schedule[i] = [{ open, close, servingUntil: "12:00 AM" }];
  }
  
  // Override with actual hours if available
  if (hours) {
    Object.entries(hours).forEach(([dayName, timeSlot]) => {
      const dayIndex = DAYS_OF_WEEK_MAP[dayName.toLowerCase()];
      if (dayIndex !== undefined && timeSlot) {
        const [open, close] = timeSlot.split(" – ").map(s => s.trim());
        if (open && close) {
          schedule[dayIndex] = [{ open, close }];
        }
      }
    });
  }
  
  return schedule;
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
  // Use cached pub data - will be shared with page component via React.cache
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
      url: `https://pubsinbangalore.com/pubs/${resolvedParams.slug}`,
      locale: "en_IN",
      siteName: "PubsInBangalore",
      images: [
        {
          url: "https://pubsinbangalore.com/og-image.png",
          width: 1200,
          height: 630,
          alt: `${pub.name} - Pub in Bangalore`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://pubsinbangalore.com/og-image.png"],
      creator: "@pubsinbangalore",
      site: "@pubsinbangalore",
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

  const operatingHours = transformOperatingHours(pub.operating_hours_raw as Record<string, string> | null);
  // Vote stats are loaded client-side to avoid blocking server render
  const voteBackendEnabled = await canUseVoteBackend();

  const mapQuery = encodeURIComponent(`${pub.name} ${pub.locality_name ?? "Bengaluru"}`);
  const mapEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&output=embed`;

  // Convert operating hours to proper schema.org format
  const openingHoursSpecification = operatingHours
    ? Object.entries(operatingHours).map(([dayOfWeek, timeRanges]) => {
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return timeRanges.map((timeRange) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: dayNames[parseInt(dayOfWeek)],
          opens: timeRange.open,
          closes: timeRange.close,
        }));
      }).flat()
    : undefined;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    name: pub.name,
    url: `https://pubsinbangalore.com/pubs/${pub.slug}`,
    description: pub.description,
    image: "https://pubsinbangalore.com/og-image.png", // Default image, can be replaced with actual pub image when available
    telephone: pub.phone ?? undefined,
    aggregateRating: pub.average_rating
      ? {
          "@type": "AggregateRating",
          ratingValue: pub.average_rating,
          reviewCount: pub.review_count ?? 0,
          bestRating: "5",
          worstRating: "1",
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
    openingHoursSpecification,
    servesCuisine: "Indian, Continental",
    acceptsReservations: "True",
    sameAs: pub.website_url ? [pub.website_url, pub.google_maps_url] : [pub.google_maps_url],
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

  // Review schema for platform ratings
  const reviewsStructuredData = pub.platform_ratings.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: pub.platform_ratings.map((rating, index) => ({
      "@type": "Review",
      position: index + 1,
      author: {
        "@type": "Organization",
        name: rating.platform,
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: rating.rating,
        bestRating: "5",
        worstRating: "1",
      },
      itemReviewed: {
        "@type": "BarOrPub",
        name: pub.name,
      },
    })),
  } : null;


  const highlightAttributes = pub.attributes
    .filter((attribute) => attribute.displayValue)
    .slice(0, 6);

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Pubs", url: "/pubs" },
  ];
  
  if (pub.locality_name && pub.locality_slug) {
    breadcrumbItems.push({
      name: pub.locality_name,
      url: `/pubs/in/${pub.locality_slug}`,
    });
  }
  
  breadcrumbItems.push({
    name: pub.name,
    url: `/pubs/${pub.slug}`,
  });

  return (
    <div className="space-y-10">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      ></script>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      ></script>
      {reviewsStructuredData && (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsStructuredData) }}
        ></script>
      )}

      <Breadcrumbs items={breadcrumbItems} />

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

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <OperatingHoursCard hours={operatingHours} />
      </section>

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

      <VotingPanel
        pubSlug={pub.slug}
        topics={DEFAULT_VOTE_TOPICS}
        initialStats={null}
        supabaseEnabled={voteBackendEnabled}
      />

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

      <NearbyPubs
        localitySlug={pub.locality_slug ?? null}
        localityName={pub.locality_name ?? null}
        currentSlug={pub.slug}
      />
    </div>
  );
}
