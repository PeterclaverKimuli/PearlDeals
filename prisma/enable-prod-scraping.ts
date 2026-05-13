import {
  assertProdWriteConfirmation,
  createProdPrismaClient,
} from "./prod-database.ts";
import { assertMerchantScrapingAllowed } from "../server/scrapers/policy.ts";

const dryRun = process.argv.includes("--dry-run");
const productionMerchantSlugs = ["jumia", "kanta", "tilyexpress"] as const;
const disabledMerchantSlugs = ["jiji"] as const;
const prisma = createProdPrismaClient();

async function main() {
  const policies = productionMerchantSlugs.map((slug) =>
    assertMerchantScrapingAllowed(slug),
  );
  const existingMerchants = await prisma.merchant.findMany({
    where: {
      slug: {
        in: [...productionMerchantSlugs, ...disabledMerchantSlugs],
      },
    },
    orderBy: {
      slug: "asc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      enabled: true,
      scrapeStrategy: true,
      _count: {
        select: {
          offers: true,
        },
      },
    },
  });

  console.log(
    JSON.stringify(
      {
        dryRun,
        productionReadyMerchants: productionMerchantSlugs,
        explicitlyDisabledMerchants: disabledMerchantSlugs,
        existingMerchants,
        policies: policies.map((policy) => ({
          merchantSlug: policy.merchantSlug,
          reviewedAt: policy.reviewedAt,
          maxRequestsPerMinute: policy.maxRequestsPerMinute,
          userAgent: policy.userAgent,
        })),
      },
      null,
      2,
    ),
  );

  if (dryRun) {
    console.log("Dry run complete. No production merchant flags were changed.");
    return;
  }

  assertProdWriteConfirmation("enable-prod-scraping");

  const enabledMerchants = await prisma.$transaction([
    ...productionMerchantSlugs.map((slug) =>
      prisma.merchant.update({
        where: { slug },
        data: {
          enabled: true,
          scrapeStrategy: "fetch-html",
        },
        select: {
          id: true,
          name: true,
          slug: true,
          enabled: true,
          scrapeStrategy: true,
        },
      }),
    ),
    ...disabledMerchantSlugs.map((slug) =>
      prisma.merchant.update({
        where: { slug },
        data: {
          enabled: false,
          scrapeStrategy: null,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          enabled: true,
          scrapeStrategy: true,
        },
      }),
    ),
  ]);

  console.log(
    JSON.stringify(
      {
        merchants: enabledMerchants,
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
