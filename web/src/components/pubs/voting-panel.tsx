"use client";

import { useEffect, useMemo, useState } from "react";

import type { VoteStatsSnapshot, VoteTopicDefinition } from "@/lib/votes/schema";
import { getSeededVoteStats } from "@/lib/votes/fallback";

type ViewMode = "today" | "overall";

type VotingPanelProps = {
  pubSlug: string;
  topics: VoteTopicDefinition[];
  initialStats: VoteStatsSnapshot | null;
  supabaseEnabled: boolean;
};

const STORAGE_TOKEN_KEY = "pubs-voter-token";
const VOTE_LOCK_PREFIX = "pubs-vote-lock:";

const formatTimestamp = (timestamp: string | null) => {
  if (!timestamp) return "Not yet";
  const date = new Date(timestamp);
  return date.toLocaleString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });
};

export function VotingPanel({
  pubSlug,
  topics,
  initialStats,
  supabaseEnabled,
}: VotingPanelProps) {
  const [stats, setStats] = useState<VoteStatsSnapshot | null>(initialStats);
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const [lastUpdated, setLastUpdated] = useState<string | null>(initialStats?.lastUpdated ?? null);
  const [voterToken, setVoterToken] = useState<string | null>(null);
  const [loadingTopic, setLoadingTopic] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [locks, setLocks] = useState<Record<string, string>>({});

  // hydrate voter token
  useEffect(() => {
    if (!supabaseEnabled) return;
    if (typeof window === "undefined") return;

    let token = window.localStorage.getItem(STORAGE_TOKEN_KEY);
    if (!token) {
      token =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(STORAGE_TOKEN_KEY, token);
    }
    setVoterToken(token);
  }, [supabaseEnabled]);

  // Fetch vote stats client-side if not provided
  useEffect(() => {
    if (initialStats || !supabaseEnabled) {
      if (!initialStats && !supabaseEnabled) {
        setStats(getSeededVoteStats(topics));
      }
      return;
    }

    // Fetch stats from API
    fetch(`/api/pubs/${pubSlug}/votes`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch vote stats");
        return res.json();
      })
      .then((data: VoteStatsSnapshot) => {
        setStats(data);
        setLastUpdated(data.lastUpdated);
      })
      .catch((error) => {
        console.warn("Failed to load vote stats", error);
        setStats(getSeededVoteStats(topics));
      });
  }, [pubSlug, supabaseEnabled, topics, initialStats]);

  // hydrate vote locks
  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextLocks: Record<string, string> = {};
    const todayString = new Date().toDateString();

    topics.forEach((topic) => {
      const key = `${VOTE_LOCK_PREFIX}${pubSlug}:${topic.id}`;
      const stored = window.localStorage.getItem(key);
      if (!stored) {
        return;
      }
      const storedDate = new Date(stored).toDateString();
      if (storedDate === todayString) {
        nextLocks[topic.id] = stored;
      } else {
        window.localStorage.removeItem(key);
      }
    });

    setLocks(nextLocks);
  }, [pubSlug, topics]);

  const summary = useMemo(() => {
    if (!stats) return [];
    return stats.topics.map((topicStat) => {
      const topicMeta = topics.find((topic) => topic.id === topicStat.topic);
      const totalToday = topicStat.options.reduce((sum, option) => sum + option.todayVotes, 0);
      const leader = topicStat.options.reduce((current, candidate) => {
        if (!current || candidate.todayVotes > current.todayVotes) {
          return candidate;
        }
        return current;
      }, null as (typeof topicStat.options)[number] | null);

      const leaderLabel =
        topicMeta?.options.find((opt) => opt.id === leader?.optionId)?.label ?? leader?.optionId ?? "—";

      const pct = totalToday > 0 && leader ? Math.round((leader.todayVotes / totalToday) * 100) : 0;
      return {
        id: topicStat.topic,
        title: topicMeta?.title ?? topicStat.topic,
        leaderLabel,
        votes: leader?.todayVotes ?? 0,
        pct,
      };
    });
  }, [stats, topics]);

  const handleVote = async (topicId: string, optionId: string) => {
    if (!supabaseEnabled) {
      setErrorMessage("Voting backend is offline right now.");
      return;
    }
    if (!voterToken) {
      setErrorMessage("Unable to initialise voting session. Please refresh.");
      return;
    }

    setLoadingTopic(topicId);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/pubs/${pubSlug}/votes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: topicId, optionId, voterToken }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "Unable to record vote");
      }

      const payload = (await response.json()) as { stats: VoteStatsSnapshot; alreadyVoted?: boolean };
      if (payload.stats) {
        setStats(payload.stats);
        setLastUpdated(payload.stats.lastUpdated ?? new Date().toISOString());
      }

      if (!payload.alreadyVoted) {
        const key = `${VOTE_LOCK_PREFIX}${pubSlug}:${topicId}`;
        const iso = new Date().toISOString();
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, iso);
        }
        setLocks((prev) => ({ ...prev, [topicId]: iso }));
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoadingTopic(null);
    }
  };

  const totalVotes = useMemo(() => {
    if (!stats) return 0;
    return stats.topics.reduce((sum, topic) => {
      const topicTotal =
        viewMode === "today"
          ? topic.options.reduce((acc, opt) => acc + opt.todayVotes, 0)
          : topic.options.reduce((acc, opt) => acc + opt.overallVotes, 0);
      return sum + topicTotal;
    }, 0);
  }, [stats, viewMode]);

  const renderTopicCard = (topicStat: VoteStatsSnapshot["topics"][number]) => {
    const topicMeta = topics.find((topic) => topic.id === topicStat.topic);
    const total =
      viewMode === "today"
        ? topicStat.options.reduce((sum, option) => sum + option.todayVotes, 0)
        : topicStat.options.reduce((sum, option) => sum + option.overallVotes, 0);

    return (
      <div key={topicStat.topic} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{topicMeta?.title ?? topicStat.topic}</h3>
            {topicMeta?.description && (
              <p className="text-sm text-slate-500">{topicMeta.description}</p>
            )}
          </div>
          <div className="text-sm text-slate-500">{total} votes</div>
        </div>

        <div className="mt-4 space-y-4">
          {topicStat.options.map((option) => {
            const optionMeta = topicMeta?.options.find((opt) => opt.id === option.optionId);
            const count = viewMode === "today" ? option.todayVotes : option.overallVotes;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const leader = topicStat.options.every((candidate) =>
              (viewMode === "today" ? option.todayVotes : option.overallVotes) >=
              (viewMode === "today" ? candidate.todayVotes : candidate.overallVotes)
            );
            const locked = Boolean(locks[topicStat.topic]);
            const disabled = loadingTopic === topicStat.topic || !supabaseEnabled || locked;
            const buttonLabel =
              loadingTopic === topicStat.topic
                ? "Submitting..."
                : !supabaseEnabled
                ? "Voting offline"
                : locked
                ? "Voted today"
                : "Vote";

            return (
              <div key={option.optionId} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        leader ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {optionMeta?.label ?? option.optionId}
                    </span>
                    <span className="text-slate-500">{count} votes</span>
                  </div>
                  <span className="text-slate-500">{pct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full ${leader ? "bg-emerald-400" : "bg-slate-300"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleVote(topicStat.topic, option.optionId)}
                  disabled={disabled}
                  className={`w-full rounded-md border px-3 py-2 text-sm font-medium transition ${
                    loadingTopic === topicStat.topic
                      ? "cursor-wait border-emerald-200 bg-emerald-50 text-emerald-700"
                      : disabled
                      ? "cursor-not-allowed border-slate-200 text-slate-400"
                      : "border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
                  }`}
                >
                  {buttonLabel}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">
              Entry & pricing
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">Community updates & votes</h2>
            <p className="text-sm text-slate-500">
              Share what you saw at the door today. One tap per topic per day.
            </p>
            {!supabaseEnabled && (
              <p className="text-xs text-amber-600">
                Live voting will unlock soon — showing seeded vibe for now.
              </p>
            )}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
            {(["today", "overall"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                  viewMode === mode ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"
                }`}
                onClick={() => setViewMode(mode)}
              >
                {mode === "today" ? "Today" : "Overall"}
              </button>
            ))}
          </div>
        </div>

        {stats ? (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              {summary.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs text-slate-500">{item.title}</p>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{item.leaderLabel}</div>
                  <p className="text-xs text-slate-500">
                    {item.votes} votes today · {item.pct}% lead
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-5">
              {stats.topics.map((topicStat) => renderTopicCard(topicStat))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Voting will unlock when Supabase is configured. For now, rely on the static info above.
          </div>
        )}

        <div className="flex flex-col gap-2 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>Total votes {viewMode === "today" ? "today" : "overall"}: {totalVotes}</span>
          <span>Updated: {formatTimestamp(lastUpdated)}</span>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}

