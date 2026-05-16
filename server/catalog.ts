import { behavioralCategories, rawDeals } from "../src/features/deals/data.js";
import {
  enrichDeal,
  getBriefMatchingDeals,
  getRecommendationBaskets,
  getRecommendationSuggestions,
  getVisibleCategories,
  matchesDealSearch,
  normalizeDeals,
} from "../shared/deals/logic.js";
import type {
  EnrichedDeal,
  PaginationMeta,
  ShoppingBrief,
} from "../shared/deals/types.js";

const fallbackDeals = normalizeDeals(rawDeals).map((deal) => enrichDeal(deal));
const defaultPage = 1;
const defaultPageSize = 12;
const maxPageSize = 48;

export type PageOptions = {
  page?: number | string | null;
  pageSize?: number | string | null;
};

type RecommendationsOptions = PageOptions & {
  query?: string | null;
};

function toPositiveInteger(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : 0;
}

export function normalizePageOptions(options: PageOptions = {}) {
  const page = Math.max(defaultPage, toPositiveInteger(options.page) || defaultPage);
  const requestedPageSize =
    toPositiveInteger(options.pageSize) || defaultPageSize;
  const pageSize = Math.min(Math.max(1, requestedPageSize), maxPageSize);

  return {
    page,
    pageSize,
  };
}

export function paginateDeals<T>(items: T[], options: PageOptions = {}) {
  const { page, pageSize } = normalizePageOptions(options);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const pagination: PaginationMeta = {
    page: safePage,
    pageSize,
    totalCount: items.length,
    pageCount,
  };

  return {
    items: items.slice(start, start + pageSize),
    pagination,
  };
}
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
  includeDeals = true,
  page,
  pageSize,
}: {
  deals: EnrichedDeal[];
  query: string;
  selectedCategory: string | null;
  selectedBehavioralCategory: string | null;
  isViewingAllProducts: boolean;
  includeDeals?: boolean;
  page?: number | string | null;
  pageSize?: number | string | null;
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

  const filteredPage = paginateDeals(
    isPlainHomepage ? getHomepagePreviewDeals(filteredDeals, 8, 2) : filteredDeals,
    { page, pageSize },
  );

  return {
    deals: includeDeals ? deals : [],
    count: deals.length,
    visibleCategories: getVisibleCategories(deals),
    featuredDeals: getHomepageTopDeals(deals),
    behavioralDealSections,
    filteredDeals: filteredPage.items,
    allProductsTotalCount: filteredDeals.length,
    filteredDealsPagination: filteredPage.pagination,
  };
}

export function getCategoriesPayload(deals: EnrichedDeal[]) {
  return {
    categories: getVisibleCategories(deals),
    behavioralCategories,
  };
}

export function getSearchPayload(
  deals: EnrichedDeal[],
  query: string,
  options: PageOptions = {},
) {
  const results = query.trim()
    ? deals.filter((deal) => matchesDealSearch(deal, query))
    : [];
  const resultsPage = paginateDeals(results, options);

  return {
    query,
    results: resultsPage.items,
    count: results.length,
    pagination: resultsPage.pagination,
  };
}

export function getRecommendationsPayload(
  deals: EnrichedDeal[],
  brief: ShoppingBrief,
  options: RecommendationsOptions = {},
) {
  const matchingDeals = getBriefMatchingDeals(deals, brief).filter((deal) =>
    matchesDealSearch(deal, options.query ?? ""),
  );
  const matchingDealsPage = paginateDeals(matchingDeals, options);

  return {
    baskets: getRecommendationBaskets(deals, brief),
    suggestions: getRecommendationSuggestions(deals, brief),
    matchingDeals: matchingDealsPage.items,
    matchingDealsPagination: matchingDealsPage.pagination,
  };
}
