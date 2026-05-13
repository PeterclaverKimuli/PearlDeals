import { config } from "dotenv";
import type { FastifyInstance, InjectOptions } from "fastify";
import { createDevPrismaClient, getDevDatabaseUrl } from "./dev-database.ts";

const expectedVisibleProductCount = 51;
const expectedOfferCount = 167;
const expectedCategories = [
  "Accessories",
  "Appliances",
  "Computers",
  "Kitchen",
  "Monitors",
  "Phones",
  "TVs",
];

type PriceLike = {
  site?: unknown;
  price?: unknown;
  original?: unknown;
  url?: unknown;
};

type DealLike = {
  id?: unknown;
  title?: unknown;
  category?: unknown;
  prices?: unknown;
  bestDeal?: PriceLike;
  discount?: unknown;
};

type CategoryLike = {
  name?: unknown;
};

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  assertCondition(value && typeof value === "object", `${label} must be an object.`);
}

function assertDeal(value: unknown, label: string): asserts value is DealLike {
  assertRecord(value, label);
  assertCondition(typeof value.id === "number", `${label} must have a numeric id.`);
  assertCondition(typeof value.title === "string" && value.title.length > 0, `${label} must have a title.`);
  assertCondition(typeof value.category === "string" && value.category.length > 0, `${label} must have a category.`);
  assertCondition(Array.isArray(value.prices) && value.prices.length > 0, `${label} must have prices.`);
  assertRecord(value.bestDeal, `${label}.bestDeal`);
  assertCondition(typeof value.bestDeal.price === "number" && value.bestDeal.price > 0, `${label}.bestDeal must have a positive price.`);
  assertCondition(typeof value.bestDeal.site === "string" && value.bestDeal.site.length > 0, `${label}.bestDeal must have a site.`);
  assertCondition(typeof value.discount === "number" && value.discount >= 0, `${label} must have a non-negative discount.`);
}

function assertDealArray(value: unknown, label: string) {
  assertCondition(Array.isArray(value), `${label} must be an array.`);
  value.forEach((deal, index) => assertDeal(deal, `${label}[${index}]`));
  return value as DealLike[];
}

function getDealPriceCount(deals: DealLike[]) {
  return deals.reduce(
    (total, deal) => total + (Array.isArray(deal.prices) ? deal.prices.length : 0),
    0,
  );
}

function getDealPriceUrls(deals: DealLike[]) {
  return new Set(
    deals.flatMap((deal) =>
      Array.isArray(deal.prices)
        ? deal.prices
            .map((price) => {
              assertRecord(price, "deal price");
              return typeof price.url === "string" ? price.url : null;
            })
            .filter((url): url is string => !!url)
        : [],
    ),
  );
}

function getCategoryNames(value: unknown, label: string) {
  assertCondition(Array.isArray(value), `${label} must be an array.`);

  return value.map((category, index) => {
    assertRecord(category, `${label}[${index}]`);
    const typedCategory = category as CategoryLike;
    assertCondition(
      typeof typedCategory.name === "string" && typedCategory.name.length > 0,
      `${label}[${index}] must have a name.`,
    );
    return typedCategory.name;
  });
}

async function injectJson(
  app: FastifyInstance,
  options: InjectOptions | string,
) {
  const response = await app.inject(options);
  assertCondition(
    response.statusCode >= 200 && response.statusCode < 300,
    `${typeof options === "string" ? options : options.url} returned HTTP ${response.statusCode}: ${response.body}`,
  );

  return response.json() as unknown;
}

async function assertDevCounts() {
  const prisma = createDevPrismaClient();

  try {
    const [
      productCount,
      offerCount,
      visibleProductCount,
      activeOfferCount,
      failedOfferUrls,
      categoryRows,
    ] =
      await Promise.all([
        prisma.product.count(),
        prisma.offer.count(),
        prisma.product.count({
          where: {
            offers: {
              some: {
                scrapeStatus: {
                  not: "failed",
                },
              },
            },
          },
        }),
        prisma.offer.count({
          where: {
            scrapeStatus: {
              not: "failed",
            },
          },
        }),
        prisma.offer.findMany({
          where: {
            scrapeStatus: "failed",
            url: {
              not: null,
            },
          },
          select: {
            url: true,
          },
        }),
        prisma.product.groupBy({
          by: ["category"],
          where: {
            offers: {
              some: {
                scrapeStatus: {
                  not: "failed",
                },
              },
            },
          },
          _count: {
            _all: true,
          },
          orderBy: {
            category: "asc",
          },
        }),
      ]);
    const categories = categoryRows.map((row) => row.category);

    assertCondition(
      visibleProductCount === expectedVisibleProductCount,
      `Expected ${expectedVisibleProductCount} visible products, found ${visibleProductCount}.`,
    );
    assertCondition(
      offerCount === expectedOfferCount,
      `Expected ${expectedOfferCount} offers, found ${offerCount}.`,
    );
    assertCondition(
      expectedCategories.every((category) => categories.includes(category)),
      `Expected categories ${expectedCategories.join(", ")}, found ${categories.join(", ")}.`,
    );

    return {
      productCount,
      offerCount,
      activeOfferCount,
      failedScrapeOfferCount: failedOfferUrls.length,
      failedOfferUrls: failedOfferUrls
        .map((offer) => offer.url)
        .filter((url): url is string => !!url),
      visibleProductCount,
      categories,
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  config({ path: ".env.local" });
  config();

  const counts = await assertDevCounts();
  process.env.DATABASE_URL = getDevDatabaseUrl();

  const { buildApp } = await import("../server/app.ts");
  const app = buildApp();

  try {
    const dealsPayload = await injectJson(app, "/api/deals");
    assertRecord(dealsPayload, "/api/deals payload");
    const deals = assertDealArray(dealsPayload.deals, "/api/deals.deals");
    const visiblePriceUrls = getDealPriceUrls(deals);
    assertCondition(dealsPayload.count === expectedVisibleProductCount, "/api/deals count must match visible DEV products.");
    assertCondition(deals.length === expectedVisibleProductCount, "/api/deals must return all visible DEV products.");
    assertCondition(
      getDealPriceCount(deals) === counts.activeOfferCount,
      `/api/deals must expose ${counts.activeOfferCount} non-failed offers.`,
    );
    assertCondition(
      counts.failedOfferUrls.every((url) => !visiblePriceUrls.has(url)),
      "/api/deals must not expose failed scrape offer URLs.",
    );

    const firstDeal = deals[0];
    assertCondition(typeof firstDeal.id === "number", "First deal must have an id.");

    const detailPayload = await injectJson(app, `/api/deals/${firstDeal.id}`);
    assertRecord(detailPayload, "/api/deals/:id payload");
    assertDeal(detailPayload.deal, "/api/deals/:id.deal");

    const categoriesPayload = await injectJson(app, "/api/categories");
    assertRecord(categoriesPayload, "/api/categories payload");
    const visibleCategoryNames = getCategoryNames(
      categoriesPayload.categories,
      "/api/categories.categories",
    );
    assertCondition(
      expectedCategories.every((category) => visibleCategoryNames.includes(category)),
      `/api/categories missing expected category. Found ${visibleCategoryNames.join(", ")}.`,
    );
    assertCondition(
      Array.isArray(categoriesPayload.behavioralCategories),
      "/api/categories.behavioralCategories must be an array.",
    );

    const homePayload = await injectJson(app, "/api/home");
    assertRecord(homePayload, "/api/home payload");
    assertDealArray(homePayload.deals, "/api/home.deals");
    assertDealArray(homePayload.featuredDeals, "/api/home.featuredDeals");
    assertDealArray(homePayload.filteredDeals, "/api/home.filteredDeals");
    assertCondition(homePayload.count === expectedVisibleProductCount, "/api/home count must match visible DEV products.");
    assertCondition(homePayload.allProductsTotalCount === expectedVisibleProductCount, "/api/home allProductsTotalCount must match visible DEV products.");
    assertCondition(
      Array.isArray(homePayload.behavioralDealSections),
      "/api/home.behavioralDealSections must be an array.",
    );

    const allProductsPayload = await injectJson(app, "/api/home?viewAll=true");
    assertRecord(allProductsPayload, "/api/home?viewAll=true payload");
    const allProducts = assertDealArray(
      allProductsPayload.filteredDeals,
      "/api/home?viewAll=true.filteredDeals",
    );
    assertCondition(
      allProducts.length === expectedVisibleProductCount,
      "/api/home?viewAll=true must return all visible DEV products.",
    );

    for (const category of expectedCategories) {
      const categoryPayload = await injectJson(
        app,
        `/api/home?category=${encodeURIComponent(category)}`,
      );
      assertRecord(categoryPayload, `/api/home category ${category} payload`);
      const categoryDeals = assertDealArray(
        categoryPayload.filteredDeals,
        `/api/home category ${category}.filteredDeals`,
      );
      assertCondition(
        categoryDeals.length > 0,
        `/api/home category ${category} must return products.`,
      );
      assertCondition(
        categoryDeals.every((deal) => deal.category === category),
        `/api/home category ${category} must only return matching products.`,
      );
    }

    const searchPayload = await injectJson(app, "/api/search?q=Phones");
    assertRecord(searchPayload, "/api/search payload");
    const searchResults = assertDealArray(searchPayload.results, "/api/search.results");
    assertCondition(searchResults.length > 0, "/api/search?q=Phones must return matches.");
    assertCondition(searchPayload.count === searchResults.length, "/api/search count must match results length.");

    const emptySearchPayload = await injectJson(app, "/api/search?q=");
    assertRecord(emptySearchPayload, "/api/search empty payload");
    const emptySearchResults = assertDealArray(
      emptySearchPayload.results,
      "/api/search empty results",
    );
    assertCondition(emptySearchResults.length === 0, "/api/search with an empty query must return no results.");
    assertCondition(emptySearchPayload.count === 0, "/api/search empty count must be 0.");

    const recommendationsPayload = await injectJson(app, {
      method: "POST",
      url: "/api/recommendations",
      headers: {
        "content-type": "application/json",
      },
      payload: {
        budget: 10000000,
        categories: ["Phones", "TVs"],
        conditions: ["All"],
      },
    });
    assertRecord(recommendationsPayload, "/api/recommendations payload");
    assertCondition(
      Array.isArray(recommendationsPayload.baskets),
      "/api/recommendations.baskets must be an array.",
    );
    assertCondition(
      Array.isArray(recommendationsPayload.suggestions),
      "/api/recommendations.suggestions must be an array.",
    );
    assertCondition(
      recommendationsPayload.baskets.length > 0 || recommendationsPayload.suggestions.length > 0,
      "/api/recommendations must return baskets or suggestions.",
    );

    console.log(
      JSON.stringify(
        {
          status: "ok",
          counts,
          endpointChecks: [
            "/api/deals",
            "/api/deals/:id",
            "/api/categories",
            "/api/home",
            "/api/home?viewAll=true",
            "/api/home?category=<each expected category>",
            "/api/search?q=Phones",
            "/api/search?q=",
            "/api/recommendations",
          ],
        },
        null,
        2,
      ),
    );
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
