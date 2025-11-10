# CSV Ingestion Rules

This document outlines the cleansing and enrichment logic applied when loading raw scrape data (e.g. `resources/100_Scrapped_Example.csv`) into the Supabase schema.

## 1. Input Expectations

- CSV header must include: `name`, `site`, `phone`, `full_address`, `city`, `postal_code`, `country`, `rating`, `reviews`, `working_hours`, `business_status`, `description`, `location_link`.
- UTF-8 encoding, comma separated, double quotes for escaped commas.
- Working hours column may hold JSON-like strings; malformed values are dropped and logged.

## 2. Deduplication

1. Normalise `name` (lowercase, trim punctuation) and `phone` (digits only).
2. Deduplicate by `(normalised_name, postal_code)` OR `(normalised_phone)` if phone present.
3. Keep the row with higher `reviews` count when duplicates appear.

## 3. Filtering Criteria

- Drop rows where `country != 'India'` or `city` not in Bengaluru synonyms (`Bengaluru`, `Bangalore`, `Bengalooru`).
- Remove establishments that are not pubs based on keyword heuristics (see Section 6).
- Enforce review thresholds:
  - Exclude if `reviews < 50` **and** `rating < 3.0`.
  - Exclude if `reviews < 10` **and** `rating < 3.5`.
- Exclude `business_status` values other than `OPERATIONAL`.

## 4. Field Normalisation

| Field | Rule |
| --- | --- |
| `phone` | Strip non-digits, prepend `+91` if length == 10 |
| `website_url` | Force `https://` if missing scheme, lower-case hostname |
| `google_maps_url` | Validate host is `www.google.com` and path contains `/maps/place` |
| `rating` | Cast to float with one decimal |
| `reviews` | Cast to integer |
| `full_address` | Title-case, compress multiple spaces |
| `slug` | Derived using `slugify(name)` and ensuring uniqueness via suffixes |
| `operating_hours_raw` | Parse valid JSON; otherwise store `null` |

## 5. Locality Extraction

1. Attempt to parse locality from `full_address` using regex list (`Koramangala`, `Indiranagar`, `Whitefield`, etc.).
2. If not matched, fallback to geocoding lookups using OpenStreetMap Nominatim (Phase 1 integration).
3. Store matched locality slug in `pub_localities` with `is_primary = true`; log entries needing manual review.

## 6. Pub Classification Heuristics

- Include rows where `name` or `description` contains keywords: `pub`, `bar`, `brew`, `taproom`, `gastropub`, `restobar`.
- Exclude rows with `restaurant`, `diner`, `cafe`, `hotel` unless keywords list includes `bar` or `pub`.
- Use `PopularBangalorePubsKeywordReasearch.csv` to expand positive keyword list (Phase 1 enhancement).

## 7. Attribute Mapping Stub

- Provide boolean columns in enriched CSV (e.g. `Rooftop Seating`) mapped to attribute codes in `docs/data-taxonomy.md`.
- Accept `TRUE`, `FALSE`, `YES`, `NO`, `1`, `0` (case insensitive). Any other value flagged for manual review.
- Tag sets expect semicolon separated lists (e.g. `Rock;EDM`).
- Schedules expect `Day: start-end` per line (to be parsed into JSON).

## 8. Validation & Logging

- Keep an ingestion log (JSON Lines) capturing row ID, status (`imported`, `skipped`, `warning`), and reason.
- Abort batch if >15% rows fail validation to prompt manual inspection.
- Provide dry-run mode that only validates without writing to Supabase.

## 9. Output

- Upsert into Supabase using `pubs` (core fields) and `pub_attribute_values` (enrichments).
- Persist derived locality relationships in `pub_localities`.
- Store raw cleaned CSV snapshot in Supabase storage (`public/raw-imports/{timestamp}.csv`) for traceability.

## 10. Next Steps

- Integrate review-based AI classification of policies (Phase 4).
- Extend heuristics with ML-based entity classification if manual corrections remain high.



