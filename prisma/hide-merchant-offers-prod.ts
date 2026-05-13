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

  const visibleOfferCount = await prisma.offer.count({
    where: {
      merchantId: merchant.id,
      scrapeStatus: {
        not: "failed",
      },
    },
  });
  const alreadyHiddenOfferCount = await prisma.offer.count({
    where: {
      merchantId: merchant.id,
      scrapeStatus: "failed",
    },
  });

  console.log(
    JSON.stringify(
      {
        dryRun,
        merchant,
        visibleOfferCount,
        alreadyHiddenOfferCount,
      },
      null,
      2,
    ),
  );

  if (dryRun) {
    console.log("Dry run complete. No production offers were hidden.");
    return;
  }

  assertProdWriteConfirmation(`hide-${merchantSlug}-offers-prod`);

  const now = new Date();
  const [merchantUpdate, offerUpdate] = await prisma.$transaction([
    prisma.merchant.update({
      where: {
        id: merchant.id,
      },
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
    prisma.offer.updateMany({
      where: {
        merchantId: merchant.id,
        scrapeStatus: {
          not: "failed",
        },
      },
      data: {
        lastScrapedAt: now,
        failureCount: {
          increment: 1,
        },
        scrapeStatus: "failed",
      },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        merchant: merchantUpdate,
        hiddenOfferCount: offerUpdate.count,
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
