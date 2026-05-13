import { createDevPrismaClient } from "./dev-database.ts";
import { jumiaAdapter } from "../server/scrapers/adapters/jumia.ts";
import { getMerchantScrapePolicy } from "../server/scrapers/policy.ts";
import { runScrapeForOffers } from "../server/scrapers/runner.ts";

const dryRun = process.argv.includes("--dry-run");
const allowWrites = process.argv.includes("--allow-writes");
const pilot = process.argv.includes("--pilot");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const offerIdArg = process.argv.find((arg) => arg.startsWith("--offer-id="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 10;
const offerId = offerIdArg ? Number(offerIdArg.split("=")[1]) : null;
const prisma = createDevPrismaClient();

async function getJumiaOfferIds() {
  if (offerId) return [offerId];

  if (!pilot) {
    throw new Error("Pass --offer-id=<id> or --pilot.");
  }

  const offers = await prisma.offer.findMany({
    where: {
      merchant: {
        slug: "jumia",
      },
      url: {
        not: null,
      },
    },
    orderBy: { id: "asc" },
    take: limit,
    select: { id: true },
  });

  return offers.map((offer) => offer.id);
}

async function assertJumiaEnabled() {
  const policy = getMerchantScrapePolicy("jumia");
  const merchant = await prisma.merchant.findUnique({
    where: { slug: "jumia" },
    select: {
      enabled: true,
      scrapeStrategy: true,
    },
  });

  if (!policy?.allowed) {
    throw new Error("Jumia scraping policy is not enabled.");
  }

  if (!merchant?.enabled || merchant.scrapeStrategy !== "fetch-html") {
    throw new Error(
      "Jumia scraping is not enabled in DEV. Run npm.cmd run scrape:enable-jumia:dev first.",
    );
  }
}

async function main() {
  await assertJumiaEnabled();

  const offerIds = await getJumiaOfferIds();

  if (offerIds.length === 0) {
    throw new Error("No Jumia offers found for scraping.");
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        offerIds,
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
    throw new Error("Jumia scrape writes require --allow-writes.");
  }

  const scrapeRun = await runScrapeForOffers({
    prisma,
    offerIds,
    adapters: {
      jumia: jumiaAdapter,
    },
    source: offerId ? "phase-4e-jumia-offer" : "phase-4e-jumia-pilot",
  });

  console.log(
    JSON.stringify(
      {
        scrapeRunId: scrapeRun.id,
        status: scrapeRun.status,
        successCount: scrapeRun.successCount,
        failureCount: scrapeRun.failureCount,
        jobs: scrapeRun.jobs.map((job) => ({
          offerId: job.offerId,
          status: job.status,
          errorReason: job.errorReason,
        })),
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
