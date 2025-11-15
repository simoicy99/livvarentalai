import type { Listing, TenantProfile, MatchResult } from "../../../shared/types";

// match agent scores listings based on tenant preferences
// in the future, this could be replaced with AI-powered scoring using OpenAI
export function matchListingsToTenant(
  tenant: TenantProfile,
  listings: Listing[]
): MatchResult[] {
  const matches = listings.map((listing) => {
    let score = 0;
    const reasons: string[] = [];

    // score based on price (40 points max)
    if (listing.price >= tenant.budgetMin && listing.price <= tenant.budgetMax) {
      score += 40;
      reasons.push("Within budget");
    } else if (listing.price < tenant.budgetMin) {
      score += 20;
      reasons.push("Below budget");
    }

    // score based on city preference (30 points max)
    if (tenant.preferredCities.includes(listing.city)) {
      score += 30;
      reasons.push(`In preferred city: ${listing.city}`);
    }

    // score based on bedrooms (20 points max)
    if (tenant.bedrooms && listing.bedrooms === tenant.bedrooms) {
      score += 20;
      reasons.push(`${listing.bedrooms} bedrooms match`);
    } else if (tenant.bedrooms && listing.bedrooms && listing.bedrooms >= tenant.bedrooms) {
      score += 10;
      reasons.push("More bedrooms than requested");
    }

    // score based on availability (10 points max)
    if (listing.availableFrom && tenant.moveInDate) {
      const availableDate = new Date(listing.availableFrom);
      const moveInDate = new Date(tenant.moveInDate);
      if (availableDate <= moveInDate) {
        score += 10;
        reasons.push("Available when needed");
      }
    }

    return {
      listing,
      score,
      reasons,
    };
  });

  // sort by score descending
  return matches.sort((a, b) => b.score - a.score);
}

// ai-powered match scoring would go here
// example: using openai to analyze listing descriptions and tenant preferences
// to generate more nuanced match scores and reasoning
