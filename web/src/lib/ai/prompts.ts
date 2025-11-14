import type { PubDetail } from "@/lib/supabase/queries";
import type { AttributeEvidence } from "@/lib/ai/types";
import { ATTRIBUTE_METADATA } from "@/lib/data/attributes";

export function buildDescriptionPrompt(pub: PubDetail) {
  const contextLines = [
    `Name: ${pub.name}`,
    pub.locality_name ? `Locality: ${pub.locality_name}` : null,
    pub.average_rating ? `Rating: ${pub.average_rating} (${pub.review_count ?? 0} reviews)` : null,
    pub.cost_for_two_min || pub.cost_for_two_max
      ? `Cost for two: ${pub.cost_for_two_min ?? "?"}-${pub.cost_for_two_max ?? "?"}`
      : null,
    pub.happy_hours_note ? `Happy hours: ${pub.happy_hours_note}` : null,
    pub.stag_entry_policy ? `Stag entry: ${pub.stag_entry_policy}` : null,
    pub.couples_entry_policy ? `Couples entry: ${pub.couples_entry_policy}` : null,
    pub.cover_charge_redeemable !== null
      ? `Redeemable cover: ${pub.cover_charge_redeemable ? "Yes" : "No"}`
      : null,
  ].filter(Boolean);

  return `You are an SEO copywriter for an experiential nightlife guide.
Write a JSON object with:
  - summary: a 2 sentence overview (max 55 words) highlighting vibe, audience, and any signature offerings.
  - highlights: array of exactly 3 bullets, each <= 12 words, concrete amenities or perks.

Important:
- Use British/Indian spelling (₹ for currency).
- Never invent details; rely only on provided context.
- Output valid JSON only with keys {"summary", "highlights"}.

Context:
${contextLines.map((line) => `- ${line}`).join("\n")}`;
}

type AttributePromptOptions = {
  evidence?: Record<string, AttributeEvidence>;
};

export function buildAttributePrompt(pub: PubDetail, options: AttributePromptOptions = {}) {
  const costContext = pub.cost_for_two_min || pub.cost_for_two_max
    ? `Cost for two range: ${pub.cost_for_two_min ?? "?"}-${pub.cost_for_two_max ?? "?"}.`
    : "Cost data unavailable.";

  const attributeGuidance = ATTRIBUTE_METADATA.map((attribute) => {
    return `- ${attribute.code} (${attribute.label}) [${attribute.dataType}, ${attribute.tier}]: ${attribute.guidance}`;
  }).join("\n");

  const evidenceDetails =
    options.evidence && Object.keys(options.evidence).length > 0
      ? Object.entries(options.evidence)
          .map(([code, details]) => {
            const citations = details.citations
              .map((citation, index) => `${index + 1}. ${citation.url}${citation.snippet ? ` — ${citation.snippet}` : ""}`)
              .join("\n");
            return `Attribute: ${code}
Suggested value: ${JSON.stringify(details.value)}
Reasoning: ${details.reasoning ?? "n/a"}
Sources:
${citations || "None"}`;
          })
          .join("\n\n")
      : "No third-party evidence supplied.";

  return `You are a classifier converting nightlife venue details into structured attributes.
Return a JSON object with key "attributes", mapping attribute codes to values.

Rules:
- Only include keys when the venue information clearly supports them; otherwise omit the code entirely.
- Boolean values must be true/false (no strings).
- Tag sets must be arrays of descriptive strings (lowercase, trimmed).
- Integer values must be whole numbers.
- Integer ranges must be objects with numeric "min" and "max" (use same value for both if fixed).
- Ratings must be numeric 1-5 (decimals allowed).
- Schedules must be objects with weekday keys (monday–sunday) each mapping to an array of {"start","end","label"}.
- Text fields should be concise (max 20 words) and factual.
- Never output placeholder values such as "unknown", "n/a", empty objects, or zero ranges; simply omit that attribute when data is missing.
- Do not return null unless the attribute explicitly supports null (ratings may be omitted instead of null).
- Never fabricate details; prefer omitting the attribute instead of guessing.

Attribute reference:
${attributeGuidance}

Third-party evidence:
${evidenceDetails}

Venue summary:
Name: ${pub.name}
Locality: ${pub.locality_name ?? "Unknown"}
${costContext}
Existing description: ${pub.description ?? "n/a"}
Happy hours note: ${pub.happy_hours_note ?? "n/a"}
Stag entry policy: ${pub.stag_entry_policy ?? "n/a"}
Couples entry policy: ${pub.couples_entry_policy ?? "n/a"}
Redeemable cover: ${pub.cover_charge_redeemable ?? "unknown"}
WiFi available: ${pub.wifi_available ?? "unknown"}
Valet service: ${pub.valet_available ?? "unknown"}`;
}
