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

export type AttributeValue =
  | boolean
  | number
  | string
  | string[]
  | { min?: number; max?: number }
  | Record<string, unknown>
  | null;

export interface AttributeResult {
  attributes: Record<string, AttributeValue>;
}

export interface AttributeCitation {
  url: string;
  title?: string;
  publisher?: string;
  snippet?: string;
  confidence?: number;
  retrievedAt?: string;
  provider?: string;
}

export interface AttributeEvidence {
  value?: AttributeValue;
  reasoning?: string;
  citations: AttributeCitation[];
}

export interface AttributeEvidenceResult {
  attributeEvidence: Record<string, AttributeEvidence>;
}

export interface FaqResult {
  faqs: Array<{ question: string; answer: string }>;
}

export interface SchemaResult {
  schema: Record<string, unknown>;
}

export type EnrichmentResult = Partial<DescriptionResult> &
  Partial<AttributeResult> &
  Partial<AttributeEvidenceResult> &
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
