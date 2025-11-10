import type { PubDetail } from "@/lib/supabase/queries";

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

const ATTRIBUTE_CODES = [
  "rooftop_seating",
  "dance_floor",
  "live_music",
  "music_genres",
  "outdoor_seating",
  "craft_beer",
  "parking_available",
  "cover_redeemable",
  "wifi",
  "valet_service",
  "sports_screening",
  "happy_hour_schedule",
  "happy_hour_deals",
  "theme_nights",
];

export function buildAttributePrompt(pub: PubDetail) {
  const costContext = pub.cost_for_two_min || pub.cost_for_two_max
    ? `Cost for two range: ${pub.cost_for_two_min ?? "?"}-${pub.cost_for_two_max ?? "?"}.`
    : "Cost data unavailable.";

  return `You are a classifier converting nightlife venue details into structured attributes.
Return a JSON object with key "attributes", mapping attribute codes to values.

Rules:
- Supported attribute codes: ${ATTRIBUTE_CODES.join(", ")}.
- Boolean values must be true/false.
- Lists must be arrays of strings.
- Schedules must be objects with day keys (monday, tuesday...) each mapping to array of {"start","end","label"}.
- If data is unknown, omit the code entirely.
- Never fabricate details.

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
