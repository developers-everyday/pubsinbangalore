import { NextResponse } from "next/server";

import { searchPubs } from "@/lib/supabase/queries";

export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const localitySlug = searchParams.get("locality") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? "10");

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  const pubs = await searchPubs(query, { localitySlug, limit });

  return NextResponse.json({
    results: pubs.slice(0, limit).map((pub) => ({
      name: pub.name,
      slug: pub.slug,
      locality: pub.locality_name ?? pub.locality_slug,
      rating: pub.average_rating,
    })),
  });
}
