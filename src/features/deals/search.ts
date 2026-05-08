import type { EnrichedDeal } from "./types";

const under500kTerms = new Set([
  "under 500k",
  "under 500 k",
  "under 500,000",
  "under 500000",
]);

export function matchesDealSearch(deal: EnrichedDeal, query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return true;

  if (under500kTerms.has(term)) {
    return deal.bestDeal.price <= 500000;
  }

  return (
    deal.title.toLowerCase().includes(term) ||
    deal.category.toLowerCase().includes(term) ||
    deal.prices.some((price) => price.site.toLowerCase().includes(term))
  );
}
