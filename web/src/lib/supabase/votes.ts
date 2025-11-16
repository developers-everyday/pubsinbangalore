"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getServerSupabaseClient, getServiceSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import {
  DEFAULT_VOTE_TOPICS,
  type VoteStatsSnapshot,
  type VoteTopicDefinition,
  type VoteTopicStats,
} from "@/lib/votes/schema";

const IST_OFFSET_MINUTES = 330;

const hasSupabaseConfig = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

type VoteEventRow = Database["public"]["Tables"]["pub_vote_events"]["Row"];

type StatsOptions = {
  topics?: VoteTopicDefinition[];
  client?: SupabaseClient<Database>;
};

type RecordVoteArgs = {
  pubId: string;
  topic: string;
  optionId: string;
  voterToken: string;
  client?: SupabaseClient<Database>;
};

const getStartOfTodayUtcIso = (): string => {
  const now = new Date();
  const utcMillis = now.getTime();
  const istMillis = utcMillis + IST_OFFSET_MINUTES * 60_000;
  const istDate = new Date(istMillis);
  istDate.setUTCHours(0, 0, 0, 0);
  const startOfDayUtcMillis = istDate.getTime() - IST_OFFSET_MINUTES * 60_000;
  return new Date(startOfDayUtcMillis).toISOString();
};

const aggregateVotes = (events: VoteEventRow[]) => {
  const counts = new Map<string, number>();
  for (const event of events) {
    const key = `${event.topic}::${event.option_id}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
};

export async function canUseVoteBackend() {
  return hasSupabaseConfig();
}

export async function getPubVoteStats(
  pubId: string,
  options?: StatsOptions
): Promise<VoteStatsSnapshot | null> {
  const topics = options?.topics ?? DEFAULT_VOTE_TOPICS;
  const supabase = options?.client ?? (hasSupabaseConfig() ? getServerSupabaseClient() : null);

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("pub_vote_events")
    .select("topic, option_id, created_at")
    .eq("pub_id", pubId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const startOfToday = getStartOfTodayUtcIso();
  const todayEvents = data.filter((event) => event.created_at >= startOfToday);
  const todayCounts = aggregateVotes(todayEvents);
  const overallCounts = aggregateVotes(data);

  const topicsStats: VoteTopicStats[] = topics.map((topic) => ({
    topic: topic.id,
    options: topic.options.map((option) => {
      const key = `${topic.id}::${option.id}`;
      return {
        optionId: option.id,
        todayVotes: todayCounts.get(key) ?? 0,
        overallVotes: overallCounts.get(key) ?? 0,
      };
    }),
  }));

  return {
    topics: topicsStats,
    totalVotes: data.length,
    lastUpdated: data[0]?.created_at ?? null,
  };
}

export async function recordPubVote({
  pubId,
  topic,
  optionId,
  voterToken,
  client,
}: RecordVoteArgs): Promise<{ alreadyVoted: boolean }> {
  if (!voterToken?.trim()) {
    throw new Error("Voter token is required");
  }

  const supabase =
    client ??
    (hasSupabaseConfig()
      ? getServiceSupabaseClient()
      : null);

  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const dayStartIso = getStartOfTodayUtcIso();

  const { data: existing, error: existingError } = await supabase
    .from("pub_vote_events")
    .select("id")
    .eq("pub_id", pubId)
    .eq("topic", topic)
    .eq("voter_token", voterToken)
    .gte("created_at", dayStartIso)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") {
    throw new Error(existingError.message);
  }

  if (existing) {
    return { alreadyVoted: true };
  }

  const { error } = await supabase.from("pub_vote_events").insert({
    pub_id: pubId,
    topic,
    option_id: optionId,
    voter_token: voterToken,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { alreadyVoted: false };
}

