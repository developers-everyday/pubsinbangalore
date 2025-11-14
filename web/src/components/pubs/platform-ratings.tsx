"use client";

import Link from "next/link";
import { formatPlatformName, formatReviewCount } from "@/lib/utils/ratings";
import type { PlatformRating } from "@/lib/supabase/queries";

interface PlatformRatingsProps {
  platformRatings: PlatformRating[];
  googleRating?: number | null;
  googleReviewCount?: number | null;
  googleMapsUrl?: string | null;
}

export function PlatformRatings({
  platformRatings,
  googleRating,
  googleReviewCount,
  googleMapsUrl,
}: PlatformRatingsProps) {
  const hasGoogleRating = googleRating !== null && googleRating !== undefined && googleMapsUrl;
  const hasPlatformRatings = platformRatings.length > 0;

  if (!hasGoogleRating && !hasPlatformRatings) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">Platform Ratings</h3>
      <div className="space-y-2">
        {hasGoogleRating && (
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900">Google</span>
                <span className="text-sm font-semibold text-emerald-700">
                  {googleRating.toFixed(1)} ★
                </span>
                {googleReviewCount && (
                  <span className="text-xs text-slate-500">
                    ({formatReviewCount(googleReviewCount, false)})
                  </span>
                )}
              </div>
            </div>
            <Link
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View →
            </Link>
          </div>
        )}
        {platformRatings.map((platform) => (
          <div
            key={platform.platform}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900">
                  {formatPlatformName(platform.platform)}
                </span>
                <span className="text-sm font-semibold text-emerald-700">
                  {platform.rating.toFixed(1)} ★
                </span>
                {platform.review_count && (
                  <span className="text-xs text-slate-500">
                    ({formatReviewCount(platform.review_count, platform.is_growing)})
                  </span>
                )}
              </div>
              {platform.details && (
                <p className="mt-1 text-xs text-slate-600">{platform.details}</p>
              )}
            </div>
            <Link
              href={platform.citation_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

