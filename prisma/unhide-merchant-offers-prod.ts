import {
  assertProdWriteConfirmation,
  createProdPrismaClient,
} from "./prod-database.ts";

const dryRun = process.argv.includes("--dry-run");
const merchantArg = process.argv.find((arg) => arg.startsWith("--merchant="));
const merchantSlug = merchantArg?.split("=")[1] ?? "jiji";
const prisma = createProdPrismaClient();

async function main() {
  const merchant = await prisma.merchant.findUnique({
    where: {
      slug: merchantSlug,
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

  if (!merchant) {
    throw new Error(`Merchant ${merchantSlug} was not found in production.`);
  }

  const hiddenOfferCount = await prisma.offer.count({
    where: {
      merchantId: merchant.id,
      scrapeStatus: "failed",
    },
  });
  const visibleOfferCount = await prisma.offer.count({
    where: {
      merchantId: merchant.id,
      scrapeStatus: {
        not: "failed",
      },
    },
  });

  console.log(
    JSON.stringify(
      {
        dryRun,
        merchant,
        hiddenOfferCount,
        visibleOfferCount,
      },
      null,
      2,
    ),
  );

  if (dryRun) {
    console.log("Dry run complete. No production offers were unhidden.");
    return;
  }

  assertProdWriteConfirmation(`unhide-${merchantSlug}-offers-prod`);

  const offerUpdate = await prisma.offer.updateMany({
    where: {
      merchantId: merchant.id,
      scrapeStatus: "failed",
    },
    data: {
      scrapeStatus: "pending",
      failureCount: 0,
    },
  });

  console.log(
    JSON.stringify(
      {
        merchant: {
          id: merchant.id,
          name: merchant.name,
          slug: merchant.slug,
          enabled: merchant.enabled,
          scrapeStrategy: merchant.scrapeStrategy,
        },
        unhiddenOfferCount: offerUpdate.count,
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
