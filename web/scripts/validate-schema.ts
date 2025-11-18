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

/**
 * Extracts variable names from JSON.stringify() calls in dangerouslySetInnerHTML patterns
 */
function extractJsonStringifyVariables(content: string): string[] {
  const variables: string[] = [];
  // Match: dangerouslySetInnerHTML={{ __html: JSON.stringify(variableName) }}
  const regex = /dangerouslySetInnerHTML\s*=\s*{{\s*__html:\s*JSON\.stringify\((\w+)\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match[1]) {
      variables.push(match[1]);
    }
  }
  return Array.from(new Set(variables)); // Remove duplicates
}

/**
 * Finds the object literal definition for a variable
 * Returns the object literal string if found, null otherwise
 * Uses brace matching to handle nested objects
 */
function findVariableDefinition(content: string, variableName: string): string | null {
  // Find the variable assignment pattern: const variableName = ...
  const assignmentPattern = new RegExp(`const\\s+${variableName}\\s*=\\s*`, "m");
  const match = content.match(assignmentPattern);
  
  if (!match || !match.index) {
    return null;
  }

  // Start searching after the assignment
  let startPos = match.index + match[0].length;
  
  // Skip whitespace
  while (startPos < content.length && /\s/.test(content[startPos])) {
    startPos++;
  }

  // Check if we have a ternary operator pattern: ... ? { ... } : ...
  const ternaryMatch = content.substring(startPos).match(/^[^?]*\?\s*({)/);
  if (ternaryMatch) {
    startPos += ternaryMatch.index! + ternaryMatch[0].length - 1; // Position at the opening brace
  } else if (content[startPos] !== "{") {
    // Not an object literal, might be a ternary or other expression
    return null;
  }

  // Now find the matching closing brace
  let braceCount = 0;
  let inString = false;
  let stringChar = "";
  let i = startPos;

  while (i < content.length) {
    const char = content[i];
    const prevChar = i > 0 ? content[i - 1] : "";

    // Handle string literals (skip braces inside strings)
    if (!inString && (char === '"' || char === "'" || char === "`")) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar && prevChar !== "\\") {
      inString = false;
      stringChar = "";
    }

    if (!inString) {
      if (char === "{") {
        braceCount++;
      } else if (char === "}") {
        braceCount--;
        if (braceCount === 0) {
          // Found the matching closing brace
          return content.substring(startPos, i + 1);
        }
      }
    }

    i++;
  }

  return null; // No matching closing brace found
}

/**
 * Extracts basic validation info from an object literal string
 * Checks for @context and @type as string literals
 */
function validateObjectLiteralStructure(objLiteral: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for @context as a string literal
  const hasContext = /["']@context["']\s*:\s*["']https?:\/\/schema\.org["']/.test(objLiteral);
  if (!hasContext) {
    errors.push("Missing or invalid @context field (must be 'https://schema.org')");
  }

  // Check for @type as a string literal
  const hasType = /["']@type["']\s*:\s*["']([^"']+)["']/.test(objLiteral);
  if (!hasType) {
    errors.push("Missing or invalid @type field");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function validatePage(pagePath: string): Promise<ValidationResult> {
  try {
    const content = await readFile(pagePath, "utf-8");
    const allErrors: string[] = [];

    // First, try to extract JSON-LD from script tags with inline JSON
    const jsonLdMatches = content.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g);

    if (jsonLdMatches && jsonLdMatches.length > 0) {
      for (const match of jsonLdMatches) {
        // Extract JSON content from script tag
        const jsonMatch = match.match(/<script[^>]*>([\s\S]*?)<\/script>/);
        if (!jsonMatch) continue;

        const scriptBody = jsonMatch[1]?.trim() ?? "";
        if (!scriptBody) {
          // Skip if it's dangerouslySetInnerHTML (we'll handle those separately)
          if (match.includes("dangerouslySetInnerHTML")) {
            continue;
          }
          allErrors.push("Empty JSON-LD script tag");
          continue;
        }

        try {
          const jsonLd = JSON.parse(scriptBody);
          const result = validateJsonLd(jsonLd);
          if (!result.valid) {
            allErrors.push(...result.errors);
          }
        } catch (parseError) {
          allErrors.push(`Invalid JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
        }
      }
    }

    // Second, extract and validate JSON-LD from dangerouslySetInnerHTML patterns
    const jsonStringifyVariables = extractJsonStringifyVariables(content);
    
    if (jsonStringifyVariables.length > 0) {
      for (const variableName of jsonStringifyVariables) {
        const objLiteral = findVariableDefinition(content, variableName);
        if (!objLiteral) {
          allErrors.push(`Could not find definition for variable '${variableName}' used in JSON.stringify()`);
          continue;
        }

        // Validate the object literal structure
        const structureResult = validateObjectLiteralStructure(objLiteral);
        if (!structureResult.valid) {
          allErrors.push(`Variable '${variableName}': ${structureResult.errors.join(", ")}`);
        }
      }
    }

    // If no JSON-LD found at all
    if ((!jsonLdMatches || jsonLdMatches.length === 0) && jsonStringifyVariables.length === 0) {
      return {
        page: pagePath,
        valid: false,
        errors: ["No JSON-LD script tags found"],
      };
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

