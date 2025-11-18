"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { PubSummary } from "@/lib/supabase/queries";
import { PubCard } from "./pub-card";

interface NearbyPubsProps {
  localitySlug: string | null;
  localityName: string | null;
  currentSlug: string;
}

export function NearbyPubs({ localitySlug, localityName, currentSlug }: NearbyPubsProps) {
  const [pubs, setPubs] = useState<PubSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localitySlug) {
      setLoading(false);
      return;
    }

    // Fetch nearby pubs client-side
    fetch(`/api/pubs/nearby?locality=${localitySlug}&limit=6`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch nearby pubs");
        return res.json();
      })
      .then((data: { pubs?: PubSummary[] }) => {
        const filtered = (data.pubs ?? [])
          .filter((pub) => pub.slug !== currentSlug)
          .slice(0, 3);
        setPubs(filtered);
      })
      .catch((error) => {
        console.warn("Failed to load nearby pubs", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [localitySlug, currentSlug]);

  if (loading || pubs.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">More in {localityName ?? "Bangalore"}</h2>
        {localitySlug && (
          <Link
            href={`/pubs/in/${localitySlug}`}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            View locality guide →
          </Link>
        )}
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {pubs.map((nearby) => (
          <PubCard key={nearby.id} pub={nearby} />
        ))}
      </div>
    </section>
  );
}

