import { NextResponse } from "next/server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getServerSupabaseClient, getServiceSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { canUseVoteBackend, getPubVoteStats, recordPubVote } from "@/lib/supabase/votes";

type RouteContext = {
  params: { slug: string };
};

async function resolvePubId(slug: string, client: SupabaseClient<Database>) {
  const { data, error } = await client.from("pubs").select("id").eq("slug", slug).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ?? null;
}

export async function GET(_request: Request, context: RouteContext) {
  if (!(await canUseVoteBackend())) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  try {
    const { slug } = context.params;
    const supabase = getServerSupabaseClient();
    const pubId = await resolvePubId(slug, supabase);

    if (!pubId) {
      return NextResponse.json({ error: "Pub not found" }, { status: 404 });
    }

    const stats = await getPubVoteStats(pubId, { client: supabase });
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  if (!(await canUseVoteBackend())) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.topic !== "string" ||
    typeof body.optionId !== "string" ||
    typeof body.voterToken !== "string" ||
    body.voterToken.trim().length === 0
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const { slug } = context.params;
    const serviceClient = getServiceSupabaseClient();
    const pubId = await resolvePubId(slug, serviceClient);

    if (!pubId) {
      return NextResponse.json({ error: "Pub not found" }, { status: 404 });
    }

    const recordResult = await recordPubVote({
      pubId,
      topic: body.topic,
      optionId: body.optionId,
      voterToken: body.voterToken,
      client: serviceClient,
    });

    const stats = await getPubVoteStats(pubId, { client: serviceClient });

    return NextResponse.json({
      alreadyVoted: recordResult.alreadyVoted,
      stats,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

