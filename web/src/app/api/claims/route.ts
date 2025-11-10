import { NextResponse } from "next/server";

import { getServiceSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.pubSlug !== "string" || typeof body.email !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const supabase = getServiceSupabaseClient();
    const { data: pub, error: pubError } = await supabase
      .from("pubs")
      .select("id, name")
      .eq("slug", body.pubSlug)
      .maybeSingle();

    if (pubError || !pub) {
      return NextResponse.json({ error: "Pub not found" }, { status: 404 });
    }

    const token = crypto.randomUUID();
    const { error } = await supabase.from("pub_claims").insert({
      pub_id: pub.id,
      email: body.email,
      status: "pending",
      verification_token: token,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Claim submitted. Check your email for verification instructions.",
      token,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.token !== "string") {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const supabase = getServiceSupabaseClient();

    const { data: claim, error } = await supabase
      .from("pub_claims")
      .select("id, status")
      .eq("verification_token", body.token)
      .maybeSingle();

    if (error || !claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    if (claim.status !== "pending") {
      return NextResponse.json({ message: "Already verified." });
    }

    const { error: updateError } = await supabase
      .from("pub_claims")
      .update({ status: "pending_verification", verified_at: new Date().toISOString() })
      .eq("id", claim.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Email verified. Await admin approval." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
