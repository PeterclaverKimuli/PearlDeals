import type { PrismaClient } from "@prisma/client";
import { createDevPrismaClient } from "./dev-database.ts";
import { createProdPrismaClient } from "./prod-database.ts";

const envArg = process.argv.find((arg) => arg.startsWith("--env="));
const merchantArg = process.argv.find((arg) => arg.startsWith("--merchant="));
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const targetEnv = envArg?.split("=")[1] ?? "prod";
const merchantSlug = merchantArg?.split("=")[1] ?? null;
const limit = limitArg ? Number(limitArg.split("=")[1]) : 5;

if (targetEnv !== "dev" && targetEnv !== "prod") {
  throw new Error('--env must be either "dev" or "prod".');
}

if (!Number.isInteger(limit) || limit <= 0) {
  throw new Error("--limit must be a positive integer.");
}

const prisma =
  targetEnv === "dev" ? createDevPrismaClient() : createProdPrismaClient();

async function getOfferStatusSummary(client: PrismaClient) {
  const rows = await client.offer.groupBy({
    by: ["merchantId", "scrapeStatus"],
    _count: {
      _all: true,
    },
    orderBy: {
      merchantId: "asc",
    },
  });
  const merchantIds = rows
    .map((row) => row.merchantId)
    .filter((id): id is number => typeof id === "number");
  const merchants = await client.merchant.findMany({
    where: {
      id: {
        in: Array.from(new Set(merchantIds)),
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      enabled: true,
      scrapeStrategy: true,
    },
  });
  const merchantById = new Map(merchants.map((merchant) => [merchant.id, merchant]));
  const summaryByMerchant = new Map<
    string,
    {
      merchantId: number | null;
      merchantName: string;
      merchantSlug: string;
      enabled: boolean | null;
      scrapeStrategy: string | null;
      totalOffers: number;
      statuses: Record<string, number>;
    }
  >();

  for (const row of rows) {
    const merchant = row.merchantId ? merchantById.get(row.merchantId) : null;
    const key = merchant?.slug ?? "unlinked";
    const existing =
      summaryByMerchant.get(key) ??
      {
        merchantId: row.merchantId,
        merchantName: merchant?.name ?? "Unlinked",
        merchantSlug: key,
        enabled: merchant?.enabled ?? null,
        scrapeStrategy: merchant?.scrapeStrategy ?? null,
        totalOffers: 0,
        statuses: {},
      };

    existing.totalOffers += row._count._all;
    existing.statuses[row.scrapeStatus] = row._count._all;
    summaryByMerchant.set(key, existing);
  }

  return Array.from(summaryByMerchant.values()).sort(
    (a, b) => b.totalOffers - a.totalOffers || a.merchantSlug.localeCompare(b.merchantSlug),
  );
}

async function main() {
  const merchantFilter = merchantSlug
    ? {
        merchant: {
          slug: merchantSlug,
        },
      }
    : {};
  const [productCount, offerCount, visibleOfferCount, hiddenOfferCount] =
    await Promise.all([
      prisma.product.count(),
      prisma.offer.count(),
      prisma.offer.count({
        where: {
          scrapeStatus: {
            not: "failed",
          },
          ...merchantFilter,
        },
      }),
      prisma.offer.count({
        where: {
          scrapeStatus: "failed",
          ...merchantFilter,
        },
      }),
    ]);
  const latestRuns = await prisma.scrapeRun.findMany({
    orderBy: {
      startedAt: "desc",
    },
    take: limit,
    select: {
      id: true,
      status: true,
      startedAt: true,
      completedAt: true,
      totalJobs: true,
      successCount: true,
      failureCount: true,
      metadata: true,
    },
  });
  const recentFailures = await prisma.scrapeJob.findMany({
    where: {
      status: "failed",
      ...(merchantSlug
        ? {
            merchant: {
              slug: merchantSlug,
            },
          }
        : {}),
    },
    orderBy: {
      startedAt: "desc",
    },
    take: limit,
    select: {
      id: true,
      offerId: true,
      merchant: {
        select: {
          name: true,
          slug: true,
        },
      },
      offer: {
        select: {
          url: true,
          product: {
            select: {
              title: true,
            },
          },
        },
      },
      errorReason: true,
      startedAt: true,
    },
  });
  const hiddenOffers = await prisma.offer.findMany({
    where: {
      scrapeStatus: "failed",
      ...merchantFilter,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: limit,
    select: {
      id: true,
      url: true,
      failureCount: true,
      lastScrapedAt: true,
      merchant: {
        select: {
          name: true,
          slug: true,
        },
      },
      product: {
        select: {
          title: true,
        },
      },
    },
  });

  console.log(
    JSON.stringify(
      {
        environment: targetEnv,
        merchantSlug: merchantSlug ?? "all",
        generatedAt: new Date().toISOString(),
        counts: {
          productCount,
          offerCount,
          visibleOfferCount,
          hiddenOfferCount,
        },
        offerStatusByMerchant: await getOfferStatusSummary(prisma),
        latestRuns,
        recentFailures,
        hiddenOffers,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
