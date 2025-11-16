export type VoteOptionDefinition = {
  id: string;
  label: string;
  subtitle?: string;
};

export type VoteTopicDefinition = {
  id: string;
  title: string;
  description?: string;
  options: VoteOptionDefinition[];
};

export type VoteTopicStats = {
  topic: string;
  options: Array<{
    optionId: string;
    todayVotes: number;
    overallVotes: number;
  }>;
};

export type VoteStatsSnapshot = {
  topics: VoteTopicStats[];
  totalVotes: number;
  lastUpdated: string | null;
};

export const DEFAULT_VOTE_TOPICS: VoteTopicDefinition[] = [
  {
    id: "stag-entry",
    title: "Stag entry",
    description: "Crowd wisdom on whether solo entry is being allowed tonight.",
    options: [
      { id: "allowed", label: "Allowed" },
      { id: "not-allowed", label: "Not allowed" },
    ],
  },
  {
    id: "cover-charge",
    title: "Cover charge",
    description: "Is there a cover charge at the door this week?",
    options: [
      { id: "cover", label: "Cover charge" },
      { id: "no-cover", label: "No cover" },
    ],
  },
  {
    id: "cover-redeemable",
    title: "Cover is redeemable",
    description: "Do you get the cover adjusted against your bill?",
    options: [
      { id: "redeemable", label: "Redeemable" },
      { id: "not-redeemable", label: "Not redeemable" },
    ],
  },
];

