import { NextResponse } from "next/server";

import { getServiceSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.pubSlug !== "string" || typeof body.message !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const supabase = getServiceSupabaseClient();
    const { data: pub, error: pubError } = await supabase
      .from("pubs")
      .select("id")
      .eq("slug", body.pubSlug)
      .maybeSingle();

    if (pubError || !pub) {
      return NextResponse.json({ error: "Pub not found" }, { status: 404 });
    }

    const { error } = await supabase.from("community_reports").insert({
      pub_id: pub.id,
      email: typeof body.email === "string" ? body.email : null,
      message: body.message,
      evidence_url: typeof body.evidenceUrl === "string" ? body.evidenceUrl : null,
      status: "pending",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Report submitted. Thanks for keeping data accurate." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
