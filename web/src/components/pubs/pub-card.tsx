import Link from "next/link";

import type { PubSummary } from "@/lib/supabase/queries";
import { formatGoogleRating } from "@/lib/utils/ratings";

interface PubCardProps {
  pub: PubSummary;
}

const ratingLabel = (rating: number | null, reviews: number | null) => {
  if (!rating) return "No rating yet";
  const reviewText = reviews ? `${reviews.toLocaleString()} reviews` : "Few reviews";
  return `${rating.toFixed(1)} • ${reviewText}`;
};

const formatCost = (min: number | null, max: number | null) => {
  if (min && max) return `₹${min.toLocaleString()} – ₹${max.toLocaleString()}`;
  if (min) return `From ₹${min.toLocaleString()}`;
  if (max) return `Up to ₹${max.toLocaleString()}`;
  return "Not specified";
};

const formatAttributeLabel = (code: string): string => {
  const labelMap: Record<string, string> = {
    rooftop_seating: "Rooftop",
    live_music: "Live Music",
    craft_beer: "Craft Beer",
    sports_screening: "Sports",
    wifi_available: "WiFi",
    valet_available: "Valet",
    pet_friendly: "Pet Friendly",
    outdoor_seating: "Outdoor",
    karaoke: "Karaoke",
    pool_table: "Pool Table",
    dart_board: "Darts",
    happy_hours: "Happy Hours",
    dance_floor: "Dance Floor",
  };
  return labelMap[code] || code.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export function PubCard({ pub }: PubCardProps) {
  const amenityBadges: string[] = [];
  
  // Add basic boolean fields
  if (pub.cover_charge_redeemable) amenityBadges.push("Redeemable cover");
  if (pub.wifi_available) amenityBadges.push("WiFi");
  if (pub.valet_available) amenityBadges.push("Valet");
  if (pub.happy_hours_note) amenityBadges.push("Happy hours");
  
  // Add attributes from pub_attribute_values
  if (pub.attributeCodes && pub.attributeCodes.length > 0) {
    pub.attributeCodes.forEach((code) => {
      const label = formatAttributeLabel(code);
      if (!amenityBadges.includes(label)) {
        amenityBadges.push(label);
      }
    });
  }

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-slate-900">
            <Link href={`/pubs/${pub.slug}`}>{pub.name}</Link>
          </h3>
          {pub.locality_name && (
            <p className="text-xs uppercase tracking-wide text-emerald-600">{pub.locality_name}</p>
          )}
          {pub.description && <p className="text-sm text-slate-600 line-clamp-2">{pub.description}</p>}
        </div>
        {pub.average_rating && (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
            {pub.average_rating.toFixed(1)} ★
          </span>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm text-slate-600 sm:grid-cols-3">
        <div>
          <dt className="font-semibold text-slate-500">Cost for two</dt>
          <dd>{formatCost(pub.cost_for_two_min, pub.cost_for_two_max)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Rating</dt>
          <dd>
            {pub.average_rating && (
              <Link
                href={pub.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                {formatGoogleRating(pub.average_rating, pub.review_count)}
              </Link>
            )}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Entry policy</dt>
          <dd>{pub.stag_entry_policy ?? "Check at venue"}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
        {amenityBadges.length > 0 ? (
          amenityBadges.map((badge) => (
            <span key={badge} className="rounded-full bg-slate-100 px-3 py-1 font-medium">
              {badge}
            </span>
          ))
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">Attributes coming soon</span>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href={pub.google_maps_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
        >
          View on Maps
        </Link>
        {pub.website_url && (
          <Link
            href={pub.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            Website
          </Link>
        )}
      </div>
    </article>
  );
}
