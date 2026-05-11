import { behavioralCategories, rawDeals } from "../src/features/deals/data.js";
import {
  enrichDeal,
  getRecommendationBaskets,
  getRecommendationSuggestions,
  getVisibleCategories,
  matchesDealSearch,
  normalizeDeals,
} from "../shared/deals/logic.js";
import type { EnrichedDeal, ShoppingBrief } from "../shared/deals/types.js";

const fallbackDeals = normalizeDeals(rawDeals).map((deal) => enrichDeal(deal));
const phoneCategoryName = "Phones";

function isPhoneDeal(deal: EnrichedDeal) {
  return deal.category === phoneCategoryName;
}

function getHomepagePreviewDeals(
  deals: EnrichedDeal[],
  visibleLimit: number,
  phoneLimit: number,
) {
  const selected: EnrichedDeal[] = [];
  let phoneCount = 0;

  for (const deal of deals) {
    if (selected.length >= visibleLimit) break;

    if (isPhoneDeal(deal)) {
      if (phoneCount >= phoneLimit) continue;
      phoneCount += 1;
    }

    selected.push(deal);
  }

  if (selected.length >= visibleLimit) return selected;

  const selectedIds = new Set(selected.map((deal) => deal.id));
  return [
    ...selected,
    ...deals.filter((deal) => !selectedIds.has(deal.id)),
  ].slice(0, visibleLimit);
}

function getSavingsAmount(deal: Pick<EnrichedDeal, "prices">) {
  if (!deal.prices.length) return 0;

  const prices = deal.prices.map((price) => price.price);
  return Math.max(0, Math.max(...prices) - Math.min(...prices));
}

function getHomepageTopDeals(deals: EnrichedDeal[]) {
  const sortedDeals = [...deals].sort(
    (a, b) =>
      getSavingsAmount(b) - getSavingsAmount(a) ||
      a.bestDeal.price - b.bestDeal.price,
  );
  const nonPhoneDeals = sortedDeals.filter((deal) => !isPhoneDeal(deal));
  const phoneDeals = sortedDeals.filter(isPhoneDeal);

  return [...nonPhoneDeals.slice(0, 2), ...phoneDeals].slice(0, 2);
}

export async function loadDeals(logger?: { warn: (payload: unknown, message?: string) => void }) {
  try {
    const { getCatalogDeals } = await import("./db.js");
    const catalogDeals = await getCatalogDeals();
    if (catalogDeals.length > 0) {
      return catalogDeals.map((deal) => enrichDeal(deal));
    }
  } catch (error) {
    logger?.warn({ error }, "Falling back to static deal catalog");
  }

  return fallbackDeals;
}

export function getHomepagePayload({
  deals,
  query,
  selectedCategory,
  selectedBehavioralCategory,
  isViewingAllProducts,
}: {
  deals: EnrichedDeal[];
  query: string;
  selectedCategory: string | null;
  selectedBehavioralCategory: string | null;
  isViewingAllProducts: boolean;
}) {
  const selectedBehavioralCategoryConfig =
    behavioralCategories.find(
      (category) => category.name === selectedBehavioralCategory,
    ) ?? null;
  const behavioralProductIds = selectedBehavioralCategoryConfig?.productIds;
  const isPlainHomepage =
    !query.trim() &&
    !selectedCategory &&
    !selectedBehavioralCategory &&
    !isViewingAllProducts;
  const filteredDeals = deals.filter((deal) => {
    const matchesCategory =
      behavioralProductIds
        ? behavioralProductIds.includes(deal.id)
        : isViewingAllProducts || !selectedCategory
          ? true
          : deal.category === selectedCategory;

    return matchesCategory && matchesDealSearch(deal, query);
  });
  const behavioralDealSections = behavioralCategories.map((category) => ({
    ...category,
    deals: getHomepagePreviewDeals(
      (category.productIds ?? [])
        .map((id) => deals.find((deal) => deal.id === id))
        .filter((deal): deal is EnrichedDeal => !!deal),
      6,
      1,
    ),
  }));

  return {
    deals,
    count: deals.length,
    visibleCategories: getVisibleCategories(deals),
    featuredDeals: getHomepageTopDeals(deals),
    behavioralDealSections,
    filteredDeals: isPlainHomepage
      ? getHomepagePreviewDeals(filteredDeals, 8, 2)
      : filteredDeals,
    allProductsTotalCount: filteredDeals.length,
  };
}

export function getCategoriesPayload(deals: EnrichedDeal[]) {
  return {
    categories: getVisibleCategories(deals),
    behavioralCategories,
  };
}

export function getSearchPayload(deals: EnrichedDeal[], query: string) {
  const results = query.trim()
    ? deals.filter((deal) => matchesDealSearch(deal, query))
    : [];

  return {
    query,
    results,
    count: results.length,
  };
}

export function getRecommendationsPayload(
  deals: EnrichedDeal[],
  brief: ShoppingBrief,
) {
  return {
    baskets: getRecommendationBaskets(deals, brief),
    suggestions: getRecommendationSuggestions(deals, brief),
  };
}
