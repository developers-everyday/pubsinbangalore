#!/usr/bin/env python3
"""
Prototype ingestion workflow for the Bangalore pubs directory.

Reads scraped CSV exports, applies cleansing rules, and emits a normalised
payload ready for Supabase upsert. Designed for Phase 0 validation; later
phases will integrate direct Supabase writes and asynchronous processing.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple
from urllib.parse import urlparse


# --- Configuration -----------------------------------------------------------------

BENGALURU_ALIASES = {"bengaluru", "bangalore", "bengalooru"}

POSITIVE_KEYWORDS = {
    "pub",
    "bar",
    "brew",
    "brewery",
    "taproom",
    "restobar",
    "gastropub",
    "night",
    "ale",
    "club",
}

NEGATIVE_KEYWORDS = {
    "hotel",
    "lodging",
    "cafe",
    "restaurant",
    "canteen",
    "dhaba",
    "mess",
    "biryani",
}

LOCALITY_PATTERNS = [
    r"koramangala",
    r"indiranagar",
    r"whitefield",
    r"mg\s+road",
    r"church\s+street",
    r"hsr\s+layout",
    r"jp\s*nagar",
    r"jayanagar",
    r"koramangala",
    r"banashankari",
    r"rajajinagar",
    r"brigade\s*road",
    r"ulsoor",
    r"vittal\s+mallya",
    r"bellandur",
    r"hebbal",
    r"btm\s+layout",
    r"yelahanka",
    r"hoodi",
]

LOCALITY_REGEX = re.compile("|".join(f"({p})" for p in LOCALITY_PATTERNS), re.IGNORECASE)


@dataclass
class IngestionConfig:
    min_reviews_low_rating: int = 50
    min_rating_low_reviews: float = 3.0
    min_reviews_very_low: int = 10
    min_rating_very_low: float = 3.5
    default_country: str = "india"
    dry_run: bool = True


# --- Utility functions --------------------------------------------------------------

def normalise_phone(raw: str) -> Optional[str]:
    if not raw:
        return None
    digits = re.sub(r"\D", "", raw)
    if not digits:
        return None
    if digits.startswith("91") and len(digits) == 12:
        return f"+{digits}"
    if len(digits) == 10:
        return f"+91{digits}"
    return f"+{digits}" if digits else None


def slugify(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9\s-]", "", value)
    value = re.sub(r"[\s_-]+", "-", value).strip("-")
    return value


def parse_float(value: str) -> Optional[float]:
    if value is None or value == "":
        return None
    try:
        return round(float(value), 1)
    except (TypeError, ValueError):
        return None


def parse_int(value: str) -> Optional[int]:
    if value is None or value == "":
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def parse_working_hours(raw: str) -> Optional[Dict[str, str]]:
    if not raw:
        return None
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            return {key.lower(): str(val) for key, val in data.items()}
    except json.JSONDecodeError:
        pass
    return None


def extract_locality(address: str) -> Optional[str]:
    if not address:
        return None
    match = LOCALITY_REGEX.search(address.lower())
    if match:
        locality = match.group(0)
        return slugify(locality)
    return None


def classify_pub(row: Dict[str, str]) -> bool:
    name = (row.get("name") or "").lower()
    description = (row.get("description") or "").lower()
    combined = f"{name} {description}"

    if any(word in combined for word in POSITIVE_KEYWORDS):
        return True
    if any(word in combined for word in NEGATIVE_KEYWORDS):
        return False
    return True


def passes_review_filters(row: Dict[str, str], cfg: IngestionConfig) -> bool:
    rating = parse_float(row.get("rating"))
    reviews = parse_int(row.get("reviews"))
    if reviews is None or rating is None:
        return False
    if reviews < cfg.min_reviews_very_low and rating < cfg.min_rating_very_low:
        return False
    if reviews < cfg.min_reviews_low_rating and rating < cfg.min_rating_low_reviews:
        return False
    return True


def is_valid_city(row: Dict[str, str], cfg: IngestionConfig) -> bool:
    city = (row.get("city") or "").lower()
    country = (row.get("country") or cfg.default_country).lower()
    return city in BENGALURU_ALIASES and country == cfg.default_country


def validate_maps_url(url: str) -> bool:
    if not url:
        return False
    parsed = urlparse(url)
    if parsed.scheme != "https":
        return False
    if parsed.netloc not in {"www.google.com", "maps.app.goo.gl"}:
        return False
    return parsed.path.startswith("/maps")


def dedupe_rows(rows: Iterable[Dict[str, str]]) -> List[Dict[str, str]]:
    seen: Dict[Tuple[str, Optional[str]], Dict[str, str]] = {}
    for row in rows:
        norm_name = slugify(row.get("name", ""))
        norm_phone = normalise_phone(row.get("phone", "") or "")
        postal_code = row.get("postal_code", "").strip()
        key = (norm_name, postal_code or norm_phone or "")
        existing = seen.get(key)
        if not existing:
            seen[key] = row
            continue
        existing_reviews = parse_int(existing.get("reviews"))
        new_reviews = parse_int(row.get("reviews"))
        if (new_reviews or 0) > (existing_reviews or 0):
            seen[key] = row
    return list(seen.values())


def normalise_row(row: Dict[str, str]) -> Dict[str, object]:
    slug = slugify(row.get("name", ""))
    phone = normalise_phone(row.get("phone", ""))
    rating = parse_float(row.get("rating"))
    reviews = parse_int(row.get("reviews"))
    maps_url = row.get("location_link") or row.get("google_maps_url")
    locality_slug = extract_locality(row.get("full_address", ""))

    return {
        "name": row.get("name"),
        "slug": slug,
        "description": row.get("description") or None,
        "google_maps_url": maps_url if validate_maps_url(maps_url or "") else None,
        "website_url": row.get("site") or None,
        "phone": phone,
        "status": (row.get("business_status") or "OPERATIONAL").lower(),
        "average_rating": rating,
        "review_count": reviews,
        "full_address": row.get("full_address") or None,
        "city": row.get("city") or None,
        "postal_code": row.get("postal_code") or None,
        "country": row.get("country") or None,
        "operating_hours_raw": parse_working_hours(row.get("working_hours", "")),
        "locality_slug": locality_slug,
    }


# --- Processing ---------------------------------------------------------------------

def load_rows(path: Path) -> List[Dict[str, str]]:
    with path.open("r", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        return [dict(row) for row in reader]


def ingest(path: Path, cfg: IngestionConfig) -> Dict[str, object]:
    raw_rows = load_rows(path)
    deduped = dedupe_rows(raw_rows)

    imported: List[Dict[str, object]] = []
    skipped: List[Dict[str, object]] = []

    for row in deduped:
        reason: Optional[str] = None
        if not is_valid_city(row, cfg):
            reason = "invalid_city"
        elif not classify_pub(row):
            reason = "classification_excluded"
        elif not passes_review_filters(row, cfg):
            reason = "failed_threshold"
        elif not validate_maps_url(row.get("location_link", "")):
            reason = "invalid_maps_url"

        if reason:
            skipped.append({"name": row.get("name"), "reason": reason})
            continue

        normalised = normalise_row(row)
        imported.append(normalised)

    return {
        "summary": {
            "input_rows": len(raw_rows),
            "post_dedupe": len(deduped),
            "imported": len(imported),
            "skipped": len(skipped),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        "imported": imported,
        "skipped": skipped,
    }


# --- CLI ----------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Clean and prepare pub CSV data.")
    parser.add_argument(
        "--input",
        type=Path,
        required=True,
        help="Absolute path to input CSV file.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        required=False,
        help="Optional path to write cleaned JSON output.",
    )
    parser.add_argument(
        "--config",
        type=Path,
        required=False,
        help="Optional JSON config overriding rating/review thresholds.",
    )
    parser.add_argument(
        "--no-dry-run",
        action="store_true",
        help="Indicates the script can proceed to Supabase writes in later phases.",
    )
    return parser


def load_config(path: Optional[Path]) -> Dict[str, object]:
    if not path:
        return {}
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if not args.input.is_absolute():
        parser.error("--input must be an absolute path.")

    cfg_data = load_config(args.config)
    cfg = IngestionConfig(
        min_reviews_low_rating=cfg_data.get("min_reviews_low_rating", 50),
        min_rating_low_reviews=cfg_data.get("min_rating_low_reviews", 3.0),
        min_reviews_very_low=cfg_data.get("min_reviews_very_low", 10),
        min_rating_very_low=cfg_data.get("min_rating_very_low", 3.5),
        default_country=cfg_data.get("default_country", "india").lower(),
        dry_run=not args.no_dry_run,
    )

    result = ingest(args.input, cfg)

    if args.output:
        if not args.output.is_absolute():
            parser.error("--output must be an absolute path.")
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, indent=2), encoding="utf-8")
    else:
        json.dump(result, sys.stdout, indent=2)
        sys.stdout.write("\n")

    if cfg.dry_run:
        print(
            "Dry run complete. No writes were executed. Use --no-dry-run when ready.",
            file=sys.stderr,
        )

    total = result["summary"]["post_dedupe"]
    failures = result["summary"]["skipped"]
    failure_ratio = failures / total if total else 0

    if failure_ratio > 0.15:
        print(
            "Warning: more than 15% of rows were skipped. Review skipped report.",
            file=sys.stderr,
        )
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())

