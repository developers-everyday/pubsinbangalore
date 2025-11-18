import { NextResponse } from "next/server";

import { getLocalityPageData } from "@/lib/supabase/queries";

export const revalidate = 3600; // Cache for 1 hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const localitySlug = searchParams.get("locality");
  const limit = Number(searchParams.get("limit") ?? "6");

  if (!localitySlug) {
    return NextResponse.json({ error: "locality parameter is required" }, { status: 400 });
  }

  try {
    const { pubs } = await getLocalityPageData(localitySlug, { limit });
    return NextResponse.json({ pubs });
  } catch (error) {
    console.error("Failed to fetch nearby pubs", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch nearby pubs" },
      { status: 500 }
    );
  }
}

