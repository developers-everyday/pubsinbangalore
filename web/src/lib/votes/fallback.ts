import { DEFAULT_VOTE_TOPICS, type VoteStatsSnapshot, type VoteTopicDefinition } from "@/lib/votes/schema";

type SeedCounts = Record<
  string,
  Record<
    string,
    {
      today: number;
      overall: number;
    }
  >
>;

const SEEDED_COUNTS: SeedCounts = {
  "stag-entry": {
    allowed: { today: 22, overall: 420 },
    "not-allowed": { today: 20, overall: 380 },
  },
  "cover-charge": {
    cover: { today: 14, overall: 210 },
    "no-cover": { today: 28, overall: 610 },
  },
  "cover-redeemable": {
    redeemable: { today: 22, overall: 390 },
    "not-redeemable": { today: 20, overall: 360 },
  },
};

export function getSeededVoteStats(
  topics: VoteTopicDefinition[] = DEFAULT_VOTE_TOPICS
): VoteStatsSnapshot {
  const generatedAt = new Date().toISOString();

  const mapped = topics.map((topic) => {
    const topicSeed = SEEDED_COUNTS[topic.id] ?? {};
    return {
      topic: topic.id,
      options: topic.options.map((option) => {
        const counts = topicSeed[option.id] ?? { today: 0, overall: 0 };
        const overall =
          counts.overall >= counts.today ? counts.overall : counts.today + counts.overall;
        return {
          optionId: option.id,
          todayVotes: counts.today,
          overallVotes: overall,
        };
      }),
    };
  });

  const totalVotes = mapped.reduce(
    (sum, topic) => sum + topic.options.reduce((acc, opt) => acc + opt.overallVotes, 0),
    0
  );

  return {
    topics: mapped,
    totalVotes,
    lastUpdated: generatedAt,
  };
}

