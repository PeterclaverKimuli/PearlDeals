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

function getSearchTokens(query: string) {
  return query
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

function getClosestProductMatches(
  deals: EnrichedDeal[],
  query: string,
  limit = 8,
) {
  const tokens = getSearchTokens(query);
  if (tokens.length === 0) return [];

  return deals
    .map((deal) => {
      const haystack = [
        deal.title,
        deal.category,
        ...deal.prices.map((price) => price.site),
      ]
        .join(" ")
        .toLowerCase();
      const score = tokens.reduce(
        (total, token) => total + (haystack.includes(token) ? 1 : 0),
        0,
      );

      return { deal, score };
    })
    .filter(({ deal, score }) => score > 0 && !matchesDealSearch(deal, query))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.deal.bestDeal.price - b.deal.bestDeal.price ||
        b.deal.discount - a.deal.discount,
    )
    .slice(0, limit)
    .map(({ deal }) => deal);
}

function sortProductMatches(deals: EnrichedDeal[]) {
  return [...deals].sort(
    (a, b) =>
      a.bestDeal.price - b.bestDeal.price ||
      b.discount - a.discount ||
      a.title.localeCompare(b.title),
  );
}

export function getRecommendationsPayload(
  deals: EnrichedDeal[],
  brief: ShoppingBrief,
  options: RecommendationsOptions = {},
) {
  const query = options.query ?? "";
  const productQuery = brief.productQuery?.trim() ?? "";
  const hasProductQuery = !!productQuery;
  const exactProductMatches = hasProductQuery
    ? sortProductMatches(deals.filter((deal) => matchesDealSearch(deal, productQuery)))
    : [];
  const productEligibleMatches = exactProductMatches
    .map((deal) => getBriefMatchingDeals([deal], { ...brief, categories: [] })[0])
    .filter((deal): deal is EnrichedDeal => !!deal);
  const productAnchor = productEligibleMatches[0];
  const productAnchorCategory = productAnchor?.category;
  const productAddOnCategories =
    productAnchorCategory && typeof brief.budget === "number"
      ? brief.categories.filter((category) => category !== productAnchorCategory)
      : [];
  const fallbackAddOnCategories =
    hasProductQuery && brief.categories.length > 0 && !productAnchor
      ? brief.categories
      : [];
  const productRemainingBudget =
    productAnchor && typeof brief.budget === "number"
      ? Math.max(0, brief.budget - productAnchor.bestDeal.price)
      : undefined;
  const shouldBuildProductAddOns =
    !!productAnchor &&
    productAddOnCategories.length > 0 &&
    typeof productRemainingBudget === "number" &&
    productRemainingBudget > 0;
  const addOnBrief: ShoppingBrief | null = shouldBuildProductAddOns
    ? {
        ...brief,
        productQuery: undefined,
        categories: productAddOnCategories,
        budget: productRemainingBudget,
      }
    : null;
  const productAddOnMatches = addOnBrief
    ? getBriefMatchingDeals(deals, addOnBrief)
    : [];
  const eligibleDeals = hasProductQuery
    ? productEligibleMatches
    : getBriefMatchingDeals(deals, brief);
  const matchingDeals = eligibleDeals.filter((deal) =>
    matchesDealSearch(deal, hasProductQuery ? productQuery : query),
  );
  const matchingDealsPage = paginateDeals(matchingDeals, options);
  const conditionFilteredProductMatches = exactProductMatches.filter(
    (deal) => !matchingDeals.some((matchingDeal) => matchingDeal.id === deal.id),
  );
  const productClosestMatches =
    hasProductQuery && matchingDeals.length === 0
      ? conditionFilteredProductMatches.length > 0
        ? conditionFilteredProductMatches
        : getClosestProductMatches(deals, productQuery)
      : [];
  const productResultState = !hasProductQuery
    ? "not_applicable"
    : matchingDeals.length > 0
      ? "exact"
      : conditionFilteredProductMatches.length > 0
        ? "condition_mismatch"
      : productClosestMatches.length > 0
        ? "closest"
        : "none";

  return {
    baskets: addOnBrief
      ? getRecommendationBaskets(deals, addOnBrief)
      : getRecommendationBaskets(deals, brief),
    suggestions: getRecommendationSuggestions(deals, brief),
    matchingDeals: matchingDealsPage.items,
    matchingDealsPagination: matchingDealsPage.pagination,
    productMatches: hasProductQuery ? productEligibleMatches : [],
    productAnchor,
    productAddOnCategories:
      productAddOnCategories.length > 0
        ? productAddOnCategories
        : fallbackAddOnCategories,
    productAddOnMatches,
    productRemainingBudget,
    productOriginalBudget: brief.budget,
    productClosestMatches,
    productResultState,
  };
}
