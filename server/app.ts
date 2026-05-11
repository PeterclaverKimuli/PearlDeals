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
