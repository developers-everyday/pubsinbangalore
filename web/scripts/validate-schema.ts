#!/usr/bin/env tsx

/**
 * Schema validation script for JSON-LD structured data
 * 
 * Validates that all pages have valid JSON-LD structured data
 * Run with: npm run validate:schema
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

interface ValidationResult {
  page: string;
  valid: boolean;
  errors: string[];
}

function validateJsonLd(jsonLd: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!jsonLd || typeof jsonLd !== "object") {
    return { valid: false, errors: ["JSON-LD must be an object"] };
  }

  const obj = jsonLd as Record<string, unknown>;

  // Check for required @context
  if (!obj["@context"]) {
    errors.push("Missing required @context field");
  } else if (typeof obj["@context"] !== "string") {
    errors.push("@context must be a string");
  }

  // Check for required @type
  if (!obj["@type"]) {
    errors.push("Missing required @type field");
  } else if (typeof obj["@type"] !== "string") {
    errors.push("@type must be a string");
  }

  // Validate common Schema.org types
  if (obj["@type"] === "BarOrPub") {
    if (!obj.name || typeof obj.name !== "string") {
      errors.push("BarOrPub must have a name field");
    }
  }

  if (obj["@type"] === "FAQPage") {
    if (!Array.isArray(obj.mainEntity)) {
      errors.push("FAQPage must have mainEntity array");
    }
  }

  // Validate aggregateRating structure if present
  if (obj.aggregateRating) {
    const rating = obj.aggregateRating as Record<string, unknown>;
    if (rating["@type"] !== "AggregateRating") {
      errors.push("aggregateRating must have @type: AggregateRating");
    }
    if (typeof rating.ratingValue !== "number") {
      errors.push("aggregateRating.ratingValue must be a number");
    }
    if (typeof rating.reviewCount !== "number") {
      errors.push("aggregateRating.reviewCount must be a number");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function validatePage(pagePath: string): Promise<ValidationResult> {
  try {
    const content = await readFile(pagePath, "utf-8");

    // Extract JSON-LD scripts
    const jsonLdMatches = content.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gs);

    if (!jsonLdMatches || jsonLdMatches.length === 0) {
      return {
        page: pagePath,
        valid: false,
        errors: ["No JSON-LD script tags found"],
      };
    }

    const allErrors: string[] = [];

    for (const match of jsonLdMatches) {
      // Extract JSON content from script tag
      const jsonMatch = match.match(/<script[^>]*>(.*?)<\/script>/s);
      if (!jsonMatch) continue;

      try {
        const jsonLd = JSON.parse(jsonMatch[1]);
        const result = validateJsonLd(jsonLd);
        if (!result.valid) {
          allErrors.push(...result.errors);
        }
      } catch (parseError) {
        allErrors.push(`Invalid JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
      }
    }

    return {
      page: pagePath,
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  } catch (error) {
    return {
      page: pagePath,
      valid: false,
      errors: [`Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`],
    };
  }
}

async function main() {
  const pagesToValidate = [
    resolve(process.cwd(), "src/app/pubs/[slug]/page.tsx"),
    resolve(process.cwd(), "src/app/pubs/in/[locality]/page.tsx"),
  ];

  console.log("Validating JSON-LD structured data...\n");

  const results: ValidationResult[] = [];

  for (const page of pagesToValidate) {
    const result = await validatePage(page);
    results.push(result);
  }

  // Print results
  let allValid = true;
  for (const result of results) {
    if (result.valid) {
      console.log(`✓ ${result.page}`);
    } else {
      allValid = false;
      console.error(`✗ ${result.page}`);
      for (const error of result.errors) {
        console.error(`  - ${error}`);
      }
    }
  }

  console.log("\n");

  if (allValid) {
    console.log("All pages have valid JSON-LD structured data!");
    process.exit(0);
  } else {
    console.error("Some pages have invalid JSON-LD structured data.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Validation script error:", error);
  process.exit(1);
});

