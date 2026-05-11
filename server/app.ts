import cors from "@fastify/cors";
import Fastify from "fastify";
import { z } from "zod";
import { behavioralCategories, rawDeals } from "../src/features/deals/data";
import { getCatalogDeals } from "./db";
import {
  enrichDeal,
  getRecommendationBaskets,
  getRecommendationSuggestions,
  getVisibleCategories,
  matchesDealSearch,
  normalizeDeals,
} from "../shared/deals/logic";
import type { EnrichedDeal } from "../shared/deals/types";

const shoppingBriefSchema = z.object({
  budget: z.number().nonnegative(),
  categories: z.array(z.string()),
  conditions: z.array(z.enum(["New", "Refurbished", "Used", "All"])),
});

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

function getHomepagePayload({
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
    filteredDeals: query.trim()
      ? filteredDeals
      : getHomepagePreviewDeals(filteredDeals, 8, 2),
    allProductsTotalCount: filteredDeals.length,
  };
}

async function loadDeals(app: ReturnType<typeof Fastify>): Promise<EnrichedDeal[]> {
  try {
    const catalogDeals = await getCatalogDeals();
    if (catalogDeals.length > 0) {
      return catalogDeals.map((deal) => enrichDeal(deal));
    }
  } catch (error) {
    app.log.warn({ error }, "Falling back to static deal catalog");
  }

  return fallbackDeals;
}

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  void app.register(cors, {
    origin: true,
  });

  app.get("/api/health", async () => ({
    status: "ok",
    service: "pearldeals-api",
    timestamp: new Date().toISOString(),
  }));

  app.get("/api/deals", async () => {
    const deals = await loadDeals(app);

    return {
      deals,
      count: deals.length,
    };
  });

  app.get<{ Params: { id: string } }>("/api/deals/:id", async (request, reply) => {
    const deals = await loadDeals(app);
    const id = Number(request.params.id);
    const deal = deals.find((item) => item.id === id);

    if (!deal) {
      return reply.code(404).send({
        error: "Deal not found",
      });
    }

    return {
      deal,
    };
  });

  app.get("/api/categories", async () => {
    const deals = await loadDeals(app);

    return {
      categories: getVisibleCategories(deals),
      behavioralCategories,
    };
  });

  app.get<{
    Querystring: {
      q?: string;
      category?: string;
      behavioralCategory?: string;
      viewAll?: string;
    };
  }>("/api/home", async (request) => {
    const deals = await loadDeals(app);

    return getHomepagePayload({
      deals,
      query: request.query.q ?? "",
      selectedCategory: request.query.category ?? null,
      selectedBehavioralCategory: request.query.behavioralCategory ?? null,
      isViewingAllProducts: request.query.viewAll === "true",
    });
  });

  app.get<{ Querystring: { q?: string } }>("/api/search", async (request) => {
    const deals = await loadDeals(app);
    const query = request.query.q ?? "";
    const results = query.trim()
      ? deals.filter((deal) => matchesDealSearch(deal, query))
      : [];

    return {
      query,
      results,
      count: results.length,
    };
  });

  app.post("/api/recommendations", async (request, reply) => {
    const deals = await loadDeals(app);
    const parsedBrief = shoppingBriefSchema.safeParse(request.body);

    if (!parsedBrief.success) {
      return reply.code(400).send({
        error: "Invalid shopping brief",
        issues: parsedBrief.error.flatten(),
      });
    }

    const brief = parsedBrief.data;

    return {
      baskets: getRecommendationBaskets(deals, brief),
      suggestions: getRecommendationSuggestions(deals, brief),
    };
  });

  return app;
}
