export type AttributeDataType =
  | "boolean"
  | "tag_set"
  | "text"
  | "integer"
  | "integer_range"
  | "rating"
  | "schedule";

export type AttributeTier = "tier1" | "tier2" | "tier3";

export interface AttributeMetadata {
  code: string;
  label: string;
  description: string;
  tier: AttributeTier;
  dataType: AttributeDataType;
  guidance: string;
}

export const ATTRIBUTE_METADATA: AttributeMetadata[] = [
  {
    code: "rooftop_seating",
    label: "Rooftop Seating",
    description: "Dedicated rooftop or terrace seating area.",
    tier: "tier1",
    dataType: "boolean",
    guidance: "true if the venue has a rooftop or terrace area for guests, otherwise false.",
  },
  {
    code: "dance_floor",
    label: "Dance Floor",
    description: "Permanent dance floor available.",
    tier: "tier1",
    dataType: "boolean",
    guidance: "true when dancing space is permanent or regularly offered (not ad-hoc).",
  },
  {
    code: "live_music",
    label: "Live Music",
    description: "Regular live music performances.",
    tier: "tier1",
    dataType: "boolean",
    guidance: "true when singers/bands perform live on a recurring schedule.",
  },
  {
    code: "music_genres",
    label: "Music Genres",
    description: "Primary music styles featured.",
    tier: "tier1",
    dataType: "tag_set",
    guidance: "Return array of lowercase genres (e.g., [\"bollywood\", \"rock\"]). Omit if unknown.",
  },
  {
    code: "outdoor_seating",
    label: "Outdoor Seating",
    description: "Outdoor/patio seating.",
    tier: "tier1",
    dataType: "boolean",
    guidance: "true for open-air patio or garden seating.",
  },
  {
    code: "craft_beer",
    label: "Craft Beer / Microbrewery",
    description: "On-site brewery or craft beer taps.",
    tier: "tier1",
    dataType: "boolean",
    guidance: "true if the venue brews or serves craft beer/microbrew specials.",
  },
  {
    code: "stag_entry_policy",
    label: "Stag Entry Policy",
    description: "Entry rules for solo/men groups.",
    tier: "tier1",
    dataType: "text",
    guidance: "Short sentence describing rules (e.g., \"Allowed with cover charge\").",
  },
  {
    code: "happy_hour_schedule",
    label: "Happy Hour Schedule",
    description: "Recurring happy hour timing.",
    tier: "tier1",
    dataType: "schedule",
    guidance:
      "Use JSON object with weekday keys (monday–sunday) each mapping to array of {\"start\",\"end\",\"label\"}. Only include actual happy hour days.",
  },
  {
    code: "cost_for_two_range",
    label: "Cost for Two Range",
    description: "Average spend for two people (INR).",
    tier: "tier1",
    dataType: "integer_range",
    guidance:
      "Return {\"min\": number, \"max\": number}. Values should be integers in INR. If only single value known set both min and max.",
  },
  {
    code: "parking_available",
    label: "Parking Available",
    description: "Parking availability notes.",
    tier: "tier1",
    dataType: "boolean",
    guidance: "true if on-site or valet parking is available, false otherwise.",
  },
  {
    code: "food_quality_rating",
    label: "Food Quality Rating",
    description: "Curated 1-5 score for food.",
    tier: "tier1",
    dataType: "rating",
    guidance: "Numeric rating 1–5 (accept decimals). Omit if insufficient info.",
  },
  {
    code: "cover_charge_range",
    label: "Cover Charge Range",
    description: "Typical cover charge (INR).",
    tier: "tier1",
    dataType: "integer_range",
    guidance: "Return {\"min\": number, \"max\": number} in INR for typical entry cover. Use same value for both if fixed.",
  },
  {
    code: "floor_count",
    label: "Number of Floors",
    description: "Distinct guest-facing levels.",
    tier: "tier2",
    dataType: "integer",
    guidance: "Whole number count of customer-accessible floors. Omit if unknown.",
  },
  {
    code: "theme_nights",
    label: "Theme Nights",
    description: "Recurring theme night schedule.",
    tier: "tier2",
    dataType: "schedule",
    guidance:
      "JSON schedule similar to happy hour but labels describe events (e.g., \"Ladies Night\"). Include only nights with clear info.",
  },
  {
    code: "view_type",
    label: "View Type",
    description: "Signature view from venue.",
    tier: "tier2",
    dataType: "tag_set",
    guidance: "Array of descriptors like [\"cityscape\", \"lake\", \"garden\"].",
  },
  {
    code: "couples_entry_policy",
    label: "Couples Entry Policy",
    description: "Entry rules for couples.",
    tier: "tier2",
    dataType: "text",
    guidance: "Short sentence, e.g., \"Complimentary entry most nights\".",
  },
  {
    code: "free_entry_days",
    label: "Free Entry Days",
    description: "Days with waived cover.",
    tier: "tier2",
    dataType: "tag_set",
    guidance: "Array of weekday names in lowercase (e.g., [\"wednesday\"]) when cover is waived.",
  },
  {
    code: "cover_redeemable",
    label: "Redeemable Cover",
    description: "Cover charge redeemable on spends.",
    tier: "tier2",
    dataType: "boolean",
    guidance: "true if the entry cover converts to food/drink credit.",
  },
  {
    code: "beer_variety",
    label: "Beer Variety",
    description: "Available beer styles.",
    tier: "tier2",
    dataType: "tag_set",
    guidance: "Array of beer styles such as [\"lager\", \"ipa\", \"stout\"].",
  },
  {
    code: "late_night_hours",
    label: "Operating Hours",
    description: "Extended operating hours summary.",
    tier: "tier2",
    dataType: "text",
    guidance: "Summarise late-night schedule (e.g., \"Open till 1 AM on weekends\").",
  },
  {
    code: "service_quality_rating",
    label: "Service Quality Rating",
    description: "Curated 1-5 score for service.",
    tier: "tier2",
    dataType: "rating",
    guidance: "Numeric rating 1–5 (allow decimals).",
  },
  {
    code: "happy_hour_deals",
    label: "Happy Hour Deals",
    description: "Types of deals during happy hour.",
    tier: "tier2",
    dataType: "tag_set",
    guidance: "Array describing offers like [\"bogo cocktails\", \"2-for-1 beers\"].",
  },
  {
    code: "sports_screening",
    label: "Sports Screening",
    description: "Live sports screenings.",
    tier: "tier3",
    dataType: "boolean",
    guidance: "true if venue regularly screens live sports on large displays.",
  },
  {
    code: "karaoke",
    label: "Karaoke Available",
    description: "Dedicated karaoke setup.",
    tier: "tier3",
    dataType: "boolean",
    guidance: "true when karaoke is available (dedicated room or stage).",
  },
  {
    code: "buffet_options",
    label: "Buffet Options",
    description: "Buffet offerings.",
    tier: "tier3",
    dataType: "tag_set",
    guidance: "Array describing buffet types (e.g., [\"brunch\", \"weekend buffet\"]).",
  },
  {
    code: "valet_service",
    label: "Valet Service",
    description: "Valet parking availability.",
    tier: "tier3",
    dataType: "boolean",
    guidance: "true if valet parking is provided.",
  },
  {
    code: "food_cuisines",
    label: "Food Cuisines",
    description: "Cuisine mix served.",
    tier: "tier3",
    dataType: "tag_set",
    guidance: "Array of cuisines such as [\"north indian\", \"continental\"].",
  },
  {
    code: "crowd_profile",
    label: "Crowd Profile",
    description: "Typical age group / vibe.",
    tier: "tier3",
    dataType: "text",
    guidance: "Short descriptor like \"Young professionals\".",
  },
  {
    code: "wifi",
    label: "WiFi Availability",
    description: "Guest WiFi access.",
    tier: "tier3",
    dataType: "boolean",
    guidance: "true if guest WiFi is offered.",
  },
];

export const ATTRIBUTE_METADATA_BY_CODE = new Map(
  ATTRIBUTE_METADATA.map((item) => [item.code, item] as const),
);




