export type EnrichmentJobType =
  | "description"
  | "attributes"
  | "faq"
  | "schema"
  | string;

export interface DescriptionResult {
  summary: string;
  highlights: string[];
}

export interface AttributeResult {
  attributes: Record<string, unknown>;
}

export interface FaqResult {
  faqs: Array<{ question: string; answer: string }>;
}

export interface SchemaResult {
  schema: Record<string, unknown>;
}

export type EnrichmentResult = Partial<DescriptionResult> &
  Partial<AttributeResult> &
  Partial<FaqResult> &
  Partial<SchemaResult>;

export interface AiResponse {
  content: string;
  parsed?: EnrichmentResult;
  model: string;
  provider: "openai" | "anthropic" | "stub";
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}
