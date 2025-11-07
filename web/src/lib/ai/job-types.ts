export const JOB_TYPES = [
  "full_enrichment",
  "description",
  "attributes",
  "faq",
  "schema",
  "insight",
] as const;

export type JobType = (typeof JOB_TYPES)[number];

export function isJobType(value: unknown): value is JobType {
  return typeof value === "string" && (JOB_TYPES as readonly string[]).includes(value);
}

export function coerceJobType(value: unknown, fallback: JobType = "full_enrichment"): JobType {
  return isJobType(value) ? value : fallback;
}

