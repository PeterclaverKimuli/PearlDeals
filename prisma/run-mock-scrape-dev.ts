import { createDevPrismaClient } from "./dev-database.ts";
import { runScrapeForOffers } from "../server/scrapers/runner.ts";
import { validateScrapeResult } from "../server/scrapers/validation.ts";
import type {
  MerchantAdapter,
  ScrapeCondition,
  ScrapeResult,
} from "../server/scrapers/types.ts";

const dryRun = process.argv.includes("--dry-run");
const allowWrites = process.argv.includes("--allow-writes");
const prisma = createDevPrismaClient();

async function getMockOffer() {
  const offerIdArg = process.argv.find((arg) => arg.startsWith("--offer-id="));
  const offerId = offerIdArg ? Number(offerIdArg.split("=")[1]) : null;

  return prisma.offer.findFirst({
    where: offerId
      ? { id: offerId, merchantId: { not: null }, url: { not: null } }
      : { merchantId: { not: null }, url: { not: null } },
    orderBy: { id: "asc" },
    include: {
      product: {
        select: {
          title: true,
        },
      },
      merchant: {
        select: {
          id: true,
          slug: true,
          baseUrl: true,
        },
      },
    },
  });
}

async function main() {
  const offer = await getMockOffer();

  if (!offer?.merchant || !offer.url) {
    throw new Error("No DEV offer with a merchant and URL is available to mock scrape.");
  }

  const condition: ScrapeCondition | undefined =
    offer.status === "Used" ||
    offer.status === "Refurbished" ||
    offer.status === "New"
      ? offer.status
      : undefined;
  const mockResult: ScrapeResult = {
    title: offer.product.title,
    price: offer.price,
    original: offer.original,
    availability: "in_stock" as const,
    condition,
    canonicalUrl: offer.url,
  };
  const validation = validateScrapeResult(offer, mockResult);

  console.log(
    JSON.stringify(
      {
        dryRun,
        offerId: offer.id,
        merchantSlug: offer.merchant.slug,
        validation,
      },
      null,
      2,
    ),
  );

  if (dryRun) {
    console.log("Dry run complete. No scrape records were written.");
    return;
  }

  if (!allowWrites) {
    throw new Error("Mock scrape writes require --allow-writes.");
  }

  const adapter: MerchantAdapter = {
    merchantSlug: offer.merchant.slug,
    async scrapeOffer() {
      return mockResult;
    },
  };
  const scrapeRun = await runScrapeForOffers({
    prisma,
    offerIds: [offer.id],
    adapters: {
      [offer.merchant.slug]: adapter,
    },
    source: "phase-4d-mock",
  });

  console.log(
    JSON.stringify(
      {
        scrapeRunId: scrapeRun.id,
        status: scrapeRun.status,
        successCount: scrapeRun.successCount,
        failureCount: scrapeRun.failureCount,
        jobCount: scrapeRun.jobs.length,
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
