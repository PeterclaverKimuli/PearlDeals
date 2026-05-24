import { getPrisma } from "./db.js";
import { normalizeDecodedText } from "./scrapers/parsing.js";
import type {
  AdminMerchantRow,
  AdminOfferRow,
  AdminProductRow,
  AdminScrapeRunRow,
  AdminSummary,
} from "../shared/admin/types.js";

const visibleOfferWhere = {
  scrapeStatus: {
    not: "failed",
  },
};

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

export async function getAdminSummary(): Promise<AdminSummary> {
  const prisma = getPrisma();
  const [
    totalProducts,
    publicVisibleProducts,
    hiddenProducts,
    totalOffers,
    visibleOffers,
    failedOffers,
    pendingOffers,
    totalMerchants,
    enabledMerchants,
    totalScrapeRuns,
    latestScrapeRun,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({
      where: {
        hidden: false,
        offers: {
          some: visibleOfferWhere,
        },
      },
    }),
    prisma.product.count({ where: { hidden: true } }),
    prisma.offer.count(),
    prisma.offer.count({ where: visibleOfferWhere }),
    prisma.offer.count({ where: { scrapeStatus: "failed" } }),
    prisma.offer.count({ where: { scrapeStatus: "pending" } }),
    prisma.merchant.count(),
    prisma.merchant.count({ where: { enabled: true } }),
    prisma.scrapeRun.count(),
    prisma.scrapeRun.findFirst({
      orderBy: { startedAt: "desc" },
      select: { status: true },
    }),
  ]);

  return {
    products: {
      total: totalProducts,
      visible: publicVisibleProducts,
      hidden: hiddenProducts,
      notListed: totalProducts - hiddenProducts - publicVisibleProducts,
    },
    offers: {
      total: totalOffers,
      visible: visibleOffers,
      failed: failedOffers,
      pending: pendingOffers,
    },
    merchants: {
      total: totalMerchants,
      enabled: enabledMerchants,
      disabled: totalMerchants - enabledMerchants,
    },
    scrapeRuns: {
      total: totalScrapeRuns,
      latestStatus: latestScrapeRun?.status ?? null,
    },
  };
}

export async function getAdminProducts(): Promise<AdminProductRow[]> {
  const products = await getPrisma().product.findMany({
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    include: {
      offers: {
        select: {
          scrapeStatus: true,
        },
      },
    },
  });

  return products.map((product) => {
    const failedOfferCount = product.offers.filter(
      (offer) => offer.scrapeStatus === "failed",
    ).length;
    const visibleOfferCount = product.offers.length - failedOfferCount;

    return {
      id: product.id,
      title: normalizeDecodedText(product.title),
      category: normalizeDecodedText(product.category),
      image: product.image,
      visibility: product.hidden
        ? "hidden"
        : visibleOfferCount > 0
          ? "visible"
          : "not_listed",
      offerCount: product.offers.length,
      visibleOfferCount,
      failedOfferCount,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  });
}

export async function getAdminOffers(): Promise<AdminOfferRow[]> {
  const offers = await getPrisma().offer.findMany({
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    include: {
      product: {
        select: {
          title: true,
        },
      },
      merchant: {
        select: {
          name: true,
        },
      },
    },
  });

  return offers.map((offer) => ({
    id: offer.id,
    productId: offer.productId,
    productTitle: normalizeDecodedText(offer.product.title),
    merchantId: offer.merchantId,
    merchantName: offer.merchant?.name ?? null,
    site: offer.site,
    price: offer.price,
    original: offer.original,
    url: offer.url,
    status: offer.status ?? "New",
    availability: offer.availability,
    scrapeStatus: offer.scrapeStatus,
    failureCount: offer.failureCount,
    lastScrapedAt: toIso(offer.lastScrapedAt),
    lastSuccessfulScrapeAt: toIso(offer.lastSuccessfulScrapeAt),
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString(),
  }));
}

export async function getAdminMerchants(): Promise<AdminMerchantRow[]> {
  const merchants = await getPrisma().merchant.findMany({
    orderBy: [{ enabled: "desc" }, { name: "asc" }],
    include: {
      offers: {
        select: {
          scrapeStatus: true,
        },
      },
    },
  });

  return merchants.map((merchant) => ({
    id: merchant.id,
    name: merchant.name,
    slug: merchant.slug,
    baseUrl: merchant.baseUrl,
    enabled: merchant.enabled,
    scrapeStrategy: merchant.scrapeStrategy,
    offerCount: merchant.offers.length,
    failedOfferCount: merchant.offers.filter(
      (offer) => offer.scrapeStatus === "failed",
    ).length,
    createdAt: merchant.createdAt.toISOString(),
    updatedAt: merchant.updatedAt.toISOString(),
  }));
}

export async function getAdminScrapeRuns(): Promise<AdminScrapeRunRow[]> {
  const runs = await getPrisma().scrapeRun.findMany({
    orderBy: { startedAt: "desc" },
  });

  return runs.map((run) => ({
    id: run.id,
    status: run.status,
    startedAt: run.startedAt.toISOString(),
    completedAt: toIso(run.completedAt),
    totalJobs: run.totalJobs,
    successCount: run.successCount,
    failureCount: run.failureCount,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
  }));
}
