# Data Taxonomy

This document consolidates the canonical data attributes that power the Bangalore pubs directory. It draws from the enrichment framework (`resources/🍻 PUBS DIRECTORY — DATA ENRICHMENT FRAM.ini`) and prioritisation matrix (`resources/pub_directory_enrichment_priority.csv`). Field names and data types are aligned with the planned Supabase schema.

## 1. Core Entities

### 1.1 `pubs`

| Field | Type | Source | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | Generated | Primary key |
| `name` | `text` | Scraped CSV (`name`) | Case preserved; uniqueness enforced per locality |
| `slug` | `text` | Derived | Lower-kebab, unique; used in routes |
| `description` | `text` | AI/manual | 2-3 sentence summary, <= 320 chars |
| `google_maps_url` | `text` | Scraped (`location_link`) | Validated URL |
| `website_url` | `text` | Scraped (`site`) | Nullable |
| `phone` | `text` | Scraped (`phone`) | Normalised E.164 where possible |
| `status` | `text` (`enum: operational, temporarily_closed, permanently_closed`) | Scraped (`business_status`) | Enum enforced |
| `average_rating` | `numeric(2,1)` | Scraped (`rating`) | 0.0 - 5.0 |
| `review_count` | `integer` | Scraped (`reviews`) | >= 0 |
| `cost_for_two_min` | `integer` | Enriched | INR; nullable |
| `cost_for_two_max` | `integer` | Enriched | INR; nullable |
| `cover_charge_min` | `integer` | Enriched | INR; nullable |
| `cover_charge_max` | `integer` | Enriched | INR; nullable |
| `cover_charge_redeemable` | `boolean` | Enriched | Nullable |
| `stag_entry_policy` | `text` | Enriched | Canonical strings e.g. `allowed`, `not_allowed`, `allowed_with_cover` |
| `couples_entry_policy` | `text` | Enriched | Canonical strings e.g. `free`, `cover_charge`, `not_allowed` |
| `wheelchair_accessible` | `boolean` | Enriched | Nullable |
| `wifi_available` | `boolean` | Enriched | Nullable |
| `valet_available` | `boolean` | Enriched | Nullable |
| `happy_hours_note` | `text` | Enriched | Free-form summary |
| `operating_hours_raw` | `jsonb` | Scraped (`working_hours`) | Normalised into structured schedule |
| `created_at` | `timestamptz` | Generated | Defaults to `now()` |
| `updated_at` | `timestamptz` | Generated | Auto-updates |

### 1.2 `localities`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `name` | `text` | Display label (e.g. `Koramangala`) |
| `slug` | `text` | Lower-kebab; used in `/pubs/in/[locality]` |
| `city` | `text` | Defaults to `Bengaluru` for launch |
| `state` | `text` | Defaults to `Karnataka` |
| `latitude` | `numeric(9,6)` | Optional centroid |
| `longitude` | `numeric(9,6)` | Optional centroid |
| `created_at`, `updated_at` | `timestamptz` | Audit timestamps |

### 1.3 `pub_localities`

Many-to-many join for pubs spanning multiple neighbourhoods (e.g. located on a border).

| Field | Type | Notes |
| --- | --- | --- |
| `pub_id` | `uuid` | FK → `pubs.id` |
| `locality_id` | `uuid` | FK → `localities.id` |
| `is_primary` | `boolean` | Marks canonical locality |

### 1.4 `attributes`

Dictionary of enrichment attributes and metadata.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `code` | `text` | Machine name (e.g. `rooftop_seating`) |
| `label` | `text` | Admin-friendly label |
| `description` | `text` | Explanation for editors |
| `tier` | `text` (`enum: tier1, tier2, tier3`) | From prioritisation CSV |
| `data_type` | `text` (`enum: boolean, rating, integer_range, text, tag_set, schedule, json`) | Controls input widgets |
| `created_at`, `updated_at` | `timestamptz` | Audit timestamps |

### 1.5 `pub_attribute_values`

Stores normalised attribute data per pub.

| Field | Type | Notes |
| --- | --- | --- |
| `pub_id` | `uuid` | FK → `pubs.id` |
| `attribute_id` | `uuid` | FK → `attributes.id` |
| `boolean_value` | `boolean` | For yes/no |
| `int_value` | `integer` | For counts (e.g. floors) |
| `numeric_min` | `integer` | For ranges (e.g. cost) |
| `numeric_max` | `integer` | For ranges |
| `text_value` | `text` | For policies/notes |
| `tags_value` | `text[]` | For tag sets (music genres, cuisines) |
| `schedule_value` | `jsonb` | For happy hours/theme nights |
| `rating_value` | `numeric(2,1)` | For quality ratings |
| `source` | `text` (`enum: scraped, ai_generated, manual`) | Provenance |
| `last_verified_at` | `timestamptz` | Moderator or community verification |

Composite unique key on (`pub_id`, `attribute_id`).

### 1.6 `ai_content_jobs`

Tracks AI enrichment and approvals (forward-looking for Phase 4).

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `pub_id` | `uuid` | FK → `pubs.id` |
| `job_type` | `text` (`enum: description, faq, schema, insight`) | |
| `status` | `text` (`enum: pending, processing, completed, failed, rejected`) | |
| `payload` | `jsonb` | Prompt input |
| `output` | `jsonb` | Model response |
| `error` | `jsonb` | Failure payload |
| `created_at`, `updated_at`, `completed_at` | `timestamptz` | |
| `approved_by` | `uuid` | FK → `profiles.id`; nullable |

## 2. Attribute Catalogue

### Tier 1 (Essential)

| Code | Label | Type | Details |
| --- | --- | --- | --- |
| `rooftop_seating` | Rooftop Seating | `boolean` | TRUE if any dedicated rooftop area |
| `dance_floor` | Dance Floor | `boolean` | TRUE if permanent dance floor |
| `live_music` | Live Music | `boolean` + `tags_value` | `tags_value` carries genres (e.g. `rock`, `bollywood`) |
| `outdoor_seating` | Outdoor Seating | `boolean` | |
| `craft_beer` | Craft Beer / Microbrewery | `boolean` | TRUE if on-site brewery or multi-brand craft taps |
| `music_genres` | Music Type / Genre | `tag_set` | Controlled vocabulary in Appendix A |
| `stag_entry_policy` | Stag Entry Policy | `text` | Canonical values with optional cover notes |
| `happy_hour_schedule` | Happy Hour Timing | `schedule` | JSON schedule schema in Appendix B |
| `cost_for_two_range` | Average Cost for Two | `integer_range` | Stores INR min/max |
| `parking_available` | Parking Available | `boolean` + `text_value` | `text_value` free-form details (valet/street) |
| `food_quality_rating` | Food Quality Rating | `rating` | 1-5 scale; derived from reviews |
| `cover_charge_range` | Cover Charges | `integer_range` | Stores min/max; align to ₹0/500/1000/2000 buckets |

### Tier 2 (High Value)

| Code | Label | Type | Details |
| --- | --- | --- | --- |
| `floor_count` | Multiple Floors/Levels | `integer` | >= 2 indicates multi-level |
| `theme_nights` | Theme Nights Schedule | `schedule` | Weekly recurring events; see Appendix B |
| `view_type` | View Type | `tag_set` | Enum values: `city`, `garden`, `metro`, `lake` |
| `couples_entry_policy` | Couples Entry Policy | `text` | Mirrors stag policy vocabulary |
| `free_entry_days` | Free Entry Days | `tag_set` | Example tags: `monday_ladies_free` |
| `cover_redeemable` | Redeemable Cover Charges | `boolean` | TRUE when cover can be redeemed |
| `beer_variety` | Beer Variety | `tag_set` | Controlled list: `wheat`, `lager`, `stout`, `ipa`, `belgian`, `cider` |
| `late_night_hours` | Operating Hours | `text` | Normalised summary, e.g. `12pm-1:30am (Fri-Sat)` |
| `service_quality_rating` | Service Quality Rating | `rating` | 1-5 scale |
| `happy_hour_deals` | Happy Hour Deals Type | `tag_set` | `b1g1`, `flat30`, `flat50`, `cocktail_combo`, etc. |

### Tier 3 (Nice to Have)

| Code | Label | Type | Details |
| --- | --- | --- | --- |
| `sports_screening` | Sports Screening | `boolean` | TRUE if regular live sports |
| `karaoke` | Karaoke Available | `boolean` | |
| `buffet_options` | Buffet Options | `tag_set` | `veg`, `non_veg`, `sunday_brunch` |
| `valet_service` | Valet Service | `boolean` | |
| `food_cuisines` | Food Cuisines Available | `tag_set` | Controlled list in Appendix A |
| `crowd_profile` | Crowd Type / Age Group | `text` | Suggested values: `young_20s`, `mixed`, `30s_plus`, `professionals` |
| `wifi` | WiFi Available | `boolean` | |

## 3. Controlled Vocabularies

### Appendix A: Tag Enumerations

- Music genres: `rock`, `bollywood`, `english_pop`, `edm`, `retro`, `indie`, `jazz`, `live_band`, `commercial`
- Beer styles: `wheat`, `lager`, `stout`, `ipa`, `belgian`, `saison`, `cider`
- Cuisines: `indian`, `north_indian`, `south_indian`, `asian`, `chinese`, `continental`, `american`, `italian`, `mexican`, `thai`, `finger_food`
- Free entry tags: `monday_ladies_free`, `tuesday_couples_free`, `wednesday_students_free`, `thursday_ladies_free`, `friday_couples_free`
- View types: `city`, `garden`, `metro`, `lake`, `street`

### Appendix B: Schedule Structure

Schedule fields are stored as JSON with the following schema:

```json
{
  "monday": [{"start": "17:00", "end": "20:00", "label": "Happy Hour"}],
  "thursday": [{"start": "20:00", "end": "23:00", "label": "Ladies Night DJ"}]
}
```

All times are stored in 24-hour `HH:MM` format. Empty arrays indicate no special schedule for the day.

## 4. Data Quality Rules

- Enforce boolean fields as strict `true` / `false` / `null` (unknown).
- Store INR values as integers (no decimals); thousands separators removed during ingestion.
- Deduplicate pubs by normalised name + street + phone combination.
- Normalise phone numbers to digits-only before applying E.164 formatting where country code is available.
- Trim whitespace and title-case locality names.
- Validate URLs with regex and reject suspicious hosts (short links, unsupported query params).

## 5. Mapping to CSV Inputs

| CSV Column | Target Field | Transformation |
| --- | --- | --- |
| `name` | `pubs.name` | Use as-is; generate slug |
| `full_address` | `pubs` + `localities` | Parse to extract locality; fallback to manual admin classification |
| `city`, `postal_code`, `country` | `pubs` | Validate equals Bengaluru/Karnataka/India |
| `rating`, `reviews` | `pubs.average_rating`, `pubs.review_count` | Cast numeric; handle missing as `null` |
| `working_hours` | `pubs.operating_hours_raw` | Parse JSON if valid; otherwise store null |
| `location_link` | `pubs.google_maps_url` | Must match `https://www.google.com/maps` pattern |
| Enriched columns (bespoke) | `pub_attribute_values.*` | Map attribute codes to correct storage columns |

## 6. Outstanding Questions

- Need canonical locality list from SEO keyword research file to seed `localities`.
- Decide on moderation workflow for community-submitted attribute changes (Phase 3 dependency).
- Confirm whether to track historical rating snapshots for trend analysis (optional extension).




