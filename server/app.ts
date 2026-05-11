import cors from "@fastify/cors";
import Fastify from "fastify";
import { z } from "zod";
import {
  getCategoriesPayload,
  getHomepagePayload,
  getRecommendationsPayload,
  getSearchPayload,
  loadDeals,
} from "./catalog.js";

const shoppingBriefSchema = z.object({
  budget: z.number().nonnegative(),
  categories: z.array(z.string()),
  conditions: z.array(z.enum(["New", "Refurbished", "Used", "All"])),
});

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
    const deals = await loadDeals(app.log);

    return {
      deals,
      count: deals.length,
    };
  });

  app.get<{ Params: { id: string } }>("/api/deals/:id", async (request, reply) => {
    const deals = await loadDeals(app.log);
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
    const deals = await loadDeals(app.log);

    return getCategoriesPayload(deals);
  });

  app.get<{
    Querystring: {
      q?: string;
      category?: string;
      behavioralCategory?: string;
      viewAll?: string;
    };
  }>("/api/home", async (request) => {
    const deals = await loadDeals(app.log);

    return getHomepagePayload({
      deals,
      query: request.query.q ?? "",
      selectedCategory: request.query.category ?? null,
      selectedBehavioralCategory: request.query.behavioralCategory ?? null,
      isViewingAllProducts: request.query.viewAll === "true",
    });
  });

  app.get<{ Querystring: { q?: string } }>("/api/search", async (request) => {
    const deals = await loadDeals(app.log);
    const query = request.query.q ?? "";

    return getSearchPayload(deals, query);
  });

  app.post("/api/recommendations", async (request, reply) => {
    const deals = await loadDeals(app.log);
    const parsedBrief = shoppingBriefSchema.safeParse(request.body);

    if (!parsedBrief.success) {
      return reply.code(400).send({
        error: "Invalid shopping brief",
        issues: parsedBrief.error.flatten(),
      });
    }

    const brief = parsedBrief.data;

    return getRecommendationsPayload(deals, brief);
  });

  return app;
}
