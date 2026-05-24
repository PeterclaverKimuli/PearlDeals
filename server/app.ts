import cors from "@fastify/cors";
import Fastify from "fastify";
import { z } from "zod";
import {
  clearAdminSessionCookie,
  createAdminSessionCookie,
  getAdminRouteSegment,
  isAdminAuthenticated,
  isAdminTokenValid,
  type AdminRequestLike,
} from "./adminAuth.js";
import {
  getAdminMerchants,
  getAdminOffers,
  getAdminProducts,
  getAdminScrapeRuns,
  getAdminSummary,
} from "./adminData.js";
import {
  createAdminProduct,
  findSimilarProducts,
  setMerchantEnabled,
  setOfferHidden,
  setProductHidden,
  updateAdminProduct,
} from "./adminMutations.js";
import { probeScrapeUrl } from "./scrapeProbe.js";
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
const adminConfirmationSchema = z.object({
  confirm: z.string(),
});
const adminMerchantEnabledSchema = adminConfirmationSchema.extend({
  enabled: z.boolean(),
});
const adminScrapeProbeSchema = z.object({
  url: z.string().trim().min(1),
});
const adminCreateProductOfferSchema = z.object({
  id: z.number().int().positive().optional(),
  merchantName: z.string(),
  price: z.number().int().positive(),
  original: z.number().int().positive(),
  url: z.string(),
  status: z.string(),
  availability: z.string(),
});
const adminCreateProductSchema = z.object({
  confirm: z.literal("create-product"),
  title: z.string(),
  category: z.string(),
  image: z.string(),
  offers: z.array(adminCreateProductOfferSchema).min(3),
});
const adminDuplicateCheckSchema = z.object({
  title: z.string(),
  category: z.string().optional().default(""),
  excludeProductId: z.number().int().positive().optional(),
});
const adminUpdateProductSchema = adminCreateProductSchema.extend({
  confirm: z.literal("update-product"),
});

function requireAdminRequest(request: AdminRequestLike) {
  return isAdminAuthenticated(request);
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
    if (!requireAdminRequest(request)) {
      return reply.code(401).send({ error: "Admin authentication required" });
    }

    return {
      status: "ok",
      service: "pearldeals-admin-api",
      timestamp: new Date().toISOString(),
    };
  });

  app.get("/api/admin/summary", async (request, reply) => {
    if (!requireAdminRequest(request)) {
      return reply.code(401).send({ error: "Admin authentication required" });
    }

    return getAdminSummary();
  });

  app.get("/api/admin/products", async (request, reply) => {
    if (!requireAdminRequest(request)) {
      return reply.code(401).send({ error: "Admin authentication required" });
    }

    return { products: await getAdminProducts() };
  });

  app.post("/api/admin/products", async (request, reply) => {
    if (!requireAdminRequest(request)) {
      return reply.code(401).send({ error: "Admin authentication required" });
    }

    const parsedBody = adminCreateProductSchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.code(400).send({ error: "Invalid product creation payload." });
    }

    try {
      return {
        created: await createAdminProduct({
          input: parsedBody.data,
          actor: "admin",
        }),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Product creation failed.";
      return reply.code(400).send({ error: message });
    }
  });

  app.post("/api/admin/products/check-duplicate", async (request, reply) => {
    if (!requireAdminRequest(request)) {
      return reply.code(401).send({ error: "Admin authentication required" });
    }

    const parsedBody = adminDuplicateCheckSchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.code(400).send({ error: "Invalid duplicate check payload." });
    }

    return {
      similarProducts: await findSimilarProducts({
        title: parsedBody.data.title,
        category: parsedBody.data.category,
        excludeProductId: parsedBody.data.excludeProductId,
        minimumScore: 0.62,
      }),
    };
  });

  app.post("/api/admin/products/:id/update", async (request, reply) => {
    if (!requireAdminRequest(request)) {
      return reply.code(401).send({ error: "Admin authentication required" });
    }

    const parsedParams = z.object({ id: z.coerce.number().int().positive() }).safeParse(request.params);
    if (!parsedParams.success) {
      return reply.code(400).send({ error: "Invalid product id." });
    }

    const parsedBody = adminUpdateProductSchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.code(400).send({ error: "Invalid product update payload." });
    }

    try {
      return {
        updated: await updateAdminProduct({
          productId: parsedParams.data.id,
          input: parsedBody.data,
          actor: "admin",
        }),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Product update failed.";
      return reply.code(400).send({ error: message });
    }
  });

  app.get("/api/admin/offers", async (request, reply) => {
    if (!requireAdminRequest(request)) {
      return reply.code(401).send({ error: "Admin authentication required" });
    }

    return { offers: await getAdminOffers() };
  });

  app.get("/api/admin/merchants", async (request, reply) => {
    if (!requireAdminRequest(request)) {
      return reply.code(401).send({ error: "Admin authentication required" });
    }

    return { merchants: await getAdminMerchants() };
  });

  app.get("/api/admin/scrape-runs", async (request, reply) => {
    if (!requireAdminRequest(request)) {
      return reply.code(401).send({ error: "Admin authentication required" });
    }

    return { scrapeRuns: await getAdminScrapeRuns() };
  });

  app.post<{ Params: { id: string } }>(
    "/api/admin/products/:id/hide",
    async (request, reply) => {
      if (!requireAdminRequest(request)) {
        return reply.code(401).send({ error: "Admin authentication required" });
      }

      const parsedBody = adminConfirmationSchema.safeParse(request.body);
      if (!parsedBody.success || parsedBody.data.confirm !== "hide-product") {
        return reply
          .code(400)
          .send({ error: 'Confirmation "hide-product" is required.' });
      }

      return {
        product: await setProductHidden({
          productId: Number(request.params.id),
          hidden: true,
          actor: "admin",
        }),
      };
    },
  );

  app.post<{ Params: { id: string } }>(
    "/api/admin/products/:id/unhide",
    async (request, reply) => {
      if (!requireAdminRequest(request)) {
        return reply.code(401).send({ error: "Admin authentication required" });
      }

      const parsedBody = adminConfirmationSchema.safeParse(request.body);
      if (!parsedBody.success || parsedBody.data.confirm !== "unhide-product") {
        return reply
          .code(400)
          .send({ error: 'Confirmation "unhide-product" is required.' });
      }

      return {
        product: await setProductHidden({
          productId: Number(request.params.id),
          hidden: false,
          actor: "admin",
        }),
      };
    },
  );

  app.post<{ Params: { id: string } }>(
    "/api/admin/offers/:id/hide",
    async (request, reply) => {
      if (!requireAdminRequest(request)) {
        return reply.code(401).send({ error: "Admin authentication required" });
      }

      const parsedBody = adminConfirmationSchema.safeParse(request.body);
      if (!parsedBody.success || parsedBody.data.confirm !== "hide-offer") {
        return reply
          .code(400)
          .send({ error: 'Confirmation "hide-offer" is required.' });
      }

      return {
        offer: await setOfferHidden({
          offerId: Number(request.params.id),
          hidden: true,
          actor: "admin",
        }),
      };
    },
  );

  app.post<{ Params: { id: string } }>(
    "/api/admin/offers/:id/unhide",
    async (request, reply) => {
      if (!requireAdminRequest(request)) {
        return reply.code(401).send({ error: "Admin authentication required" });
      }

      const parsedBody = adminConfirmationSchema.safeParse(request.body);
      if (!parsedBody.success || parsedBody.data.confirm !== "unhide-offer") {
        return reply
          .code(400)
          .send({ error: 'Confirmation "unhide-offer" is required.' });
      }

      return {
        offer: await setOfferHidden({
          offerId: Number(request.params.id),
          hidden: false,
          actor: "admin",
        }),
      };
    },
  );

  app.post<{ Params: { id: string } }>(
    "/api/admin/merchants/:id/enabled",
    async (request, reply) => {
      if (!requireAdminRequest(request)) {
        return reply.code(401).send({ error: "Admin authentication required" });
      }

      const parsedBody = adminMerchantEnabledSchema.safeParse(request.body);
      if (
        !parsedBody.success ||
        parsedBody.data.confirm !== "set-merchant-enabled"
      ) {
        return reply
          .code(400)
          .send({ error: 'Confirmation "set-merchant-enabled" is required.' });
      }

      return {
        merchant: await setMerchantEnabled({
          merchantId: Number(request.params.id),
          enabled: parsedBody.data.enabled,
          actor: "admin",
        }),
      };
    },
  );

  app.post("/api/admin/scrape-probe", async (request, reply) => {
    if (!requireAdminRequest(request)) {
      return reply.code(401).send({ error: "Admin authentication required" });
    }

    const parsedBody = adminScrapeProbeSchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.code(400).send({ error: "A URL is required." });
    }

    return {
      probe: await probeScrapeUrl(parsedBody.data.url),
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
