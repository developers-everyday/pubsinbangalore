import { NextResponse } from "next/server";
import { z } from "zod";

import { coerceJobType } from "@/lib/ai/job-types";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

const RequestSchema = z.object({
  pubId: z.string().uuid(),
  jobType: z.string().optional(),
});

export async function POST(request: Request) {
  const supabase = getServiceSupabaseClient();

  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const jobType = coerceJobType(parsed.data.jobType);

    const { data: existing } = await supabase
      .from("ai_content_jobs")
      .select("id")
      .eq("pub_id", parsed.data.pubId)
      .eq("job_type", jobType)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, id: existing.id, status: "pending" });
    }

    const { data, error } = await supabase
      .from("ai_content_jobs")
      .insert({
        pub_id: parsed.data.pubId,
        job_type: jobType,
        status: "pending",
        payload: null,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, id: data.id, status: "pending" }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected error enqueuing AI job",
      },
      { status: 500 },
    );
  }
}
