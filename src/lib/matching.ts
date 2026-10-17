
export type Resource = {
    id: string;
    name: string;
    category: string;
    description: string;
    costType: "free" | "low_cost" | "paid" | "unknown";
    city: string;
    eligibility: string | null;
    transportation: string | null;
    published: boolean;
  };
  
  export type MatchRequest = {
    categories: string[];
    location: string;
    freeOnly: boolean;
    transportation?: "transit" | "car" | "wheelchair" | "unknown";
  };
  
  export type MatchResult = {
    resource: Resource;
    score: number;
    reasons: string[];
  };
  
  export function matchResources(
    request: MatchRequest,
    resources: Resource[]
  ): MatchResult[] {
    const requestedCategories = new Set(
      request.categories.map((category) => category.toLowerCase())
    );
  
    return resources
      .filter((resource) => resource.published)
      .filter((resource) =>
        requestedCategories.has(resource.category.toLowerCase())
      )
      .filter((resource) => {
        if (!request.freeOnly) return true;
  
        // Unknown cost must not be treated as free.
        return resource.costType === "free";
      })
      .map((resource) => {
        let score = 50;
        const reasons: string[] = [
          "Matches one of your selected needs.",
        ];
  
        if (
          resource.city.toLowerCase() ===
          request.location.trim().toLowerCase()
        ) {
          score += 25;
          reasons.push("Located in your requested city.");
        }
  
        if (request.freeOnly && resource.costType === "free") {
          score += 15;
          reasons.push("Listed as free.");
        }
  
        if (
          request.transportation &&
          request.transportation !== "unknown" &&
          resource.transportation === request.transportation
        ) {
          score += 10;
          reasons.push("Transportation preference matches.");
        }
  
        return {
          resource,
          score,
          reasons,
        };
      })
      .sort((a, b) => b.score - a.score);
  }
  
