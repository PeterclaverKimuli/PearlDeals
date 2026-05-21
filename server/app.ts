import cors from "@fastify/cors";
import Fastify from "fastify";
import { z } from "zod";
import {
  clearAdminSessionCookie,
  createAdminSessionCookie,
  getAdminRouteSegment,
  isAdminAuthenticated,
  isAdminTokenValid,
} from "./adminAuth.js";
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
  budgetMode: z.enum(["manual", "surprise"]).optional(),
});

const adminLoginSchema = z.object({
  token: z.string(),
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

  app.get("/api/admin/session", async (request) => ({
    authenticated: isAdminAuthenticated(request),
    adminPath: `/${getAdminRouteSegment()}/admin`,
  }));

  app.post("/api/admin/session", async (request, reply) => {
    const parsedLogin = adminLoginSchema.safeParse(request.body);
    if (!parsedLogin.success || !isAdminTokenValid(parsedLogin.data.token)) {
      return reply.code(401).send({ error: "Invalid admin token" });
    }

    reply.header("Set-Cookie", createAdminSessionCookie(parsedLogin.data.token));
    return {
      authenticated: true,
      adminPath: `/${getAdminRouteSegment()}/admin`,
    };
  });

  app.delete("/api/admin/session", async (_request, reply) => {
    reply.header("Set-Cookie", clearAdminSessionCookie());
    return { authenticated: false };
  });

  app.get("/api/admin/health", async (request, reply) => {
    if (!isAdminAuthenticated(request)) {
      return reply.code(401).send({ error: "Admin authentication required" });
    }

    return {
      status: "ok",
      service: "pearldeals-admin-api",
      timestamp: new Date().toISOString(),
    };
  });

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
      includeDeals?: string;
      page?: string;
      pageSize?: string;
    };
  }>("/api/home", async (request) => {
    const deals = await loadDeals(app.log);

    return getHomepagePayload({
      deals,
      query: request.query.q ?? "",
      selectedCategory: request.query.category ?? null,
      selectedBehavioralCategory: request.query.behavioralCategory ?? null,
      isViewingAllProducts: request.query.viewAll === "true",
      includeDeals: request.query.includeDeals === "true",
      page: request.query.page,
      pageSize: request.query.pageSize,
    });
  });

  app.get<{ Querystring: { q?: string; page?: string; pageSize?: string } }>(
    "/api/search",
    async (request) => {
      const deals = await loadDeals(app.log);
      const query = request.query.q ?? "";

      return getSearchPayload(deals, query, {
        page: request.query.page,
        pageSize: request.query.pageSize,
      });
    },
  );

  app.post<{ Querystring: { q?: string; page?: string; pageSize?: string } }>(
    "/api/recommendations",
    async (request, reply) => {
      const deals = await loadDeals(app.log);
      const parsedBrief = shoppingBriefSchema.safeParse(request.body);

      if (!parsedBrief.success) {
        return reply.code(400).send({
          error: "Invalid shopping brief",
          issues: parsedBrief.error.flatten(),
        });
      }

      const brief = parsedBrief.data;

      return getRecommendationsPayload(deals, brief, {
        query: request.query.q,
        page: request.query.page,
        pageSize: request.query.pageSize,
      });
    },
  );

  return app;
}
