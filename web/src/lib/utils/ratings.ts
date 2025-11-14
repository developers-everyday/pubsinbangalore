/**
 * Utility functions for formatting and displaying ratings
 */

/**
 * Format review count with "and growing" indicator
 * Examples:
 * - 3241 -> "3,241+"
 * - 3241 (growing) -> "3,241+ and growing"
 */
export function formatReviewCount(
  count: number | null | undefined,
  isGrowing: boolean = false
): string {
  if (!count) return "No reviews yet";
  
  const formatted = count.toLocaleString();
  return isGrowing ? `${formatted}+ and growing` : `${formatted}+`;
}

/**
 * Format Google rating display
 * Example: "4.5 ★ (3,241+ reviews)"
 */
export function formatGoogleRating(
  rating: number | null,
  reviewCount: number | null,
  isGrowing: boolean = false
): string {
  if (!rating) return "No rating yet";
  
  const reviewText = formatReviewCount(reviewCount, isGrowing);
  return `${rating.toFixed(1)} ★ (${reviewText})`;
}

/**
 * Calculate combined rating average from platform ratings
 */
export function calculateCombinedRating(ratings: number[]): number | null {
  if (ratings.length === 0) return null;
  
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return sum / ratings.length;
}

/**
 * Format platform name for display
 * Examples: "tripadvisor" -> "TripAdvisor", "eazydiner" -> "EazyDiner"
 */
export function formatPlatformName(platform: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    tripadvisor: "TripAdvisor",
    eazydiner: "EazyDiner",
    zomato: "Zomato",
    justdial: "Justdial",
    google: "Google",
  };
  
  if (specialCases[platform.toLowerCase()]) {
    return specialCases[platform.toLowerCase()];
  }
  
  // Capitalize first letter of each word
  return platform
    .split(/[-_\s]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

