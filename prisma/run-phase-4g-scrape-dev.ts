import { createDevPrismaClient } from "./dev-database.ts";
import { jijiAdapter } from "../server/scrapers/adapters/jiji.ts";
import { jumiaAdapter } from "../server/scrapers/adapters/jumia.ts";
import { kantaAdapter } from "../server/scrapers/adapters/kanta.ts";
import { tilyexpressAdapter } from "../server/scrapers/adapters/tilyexpress.ts";
import { runScrapeForOffers } from "../server/scrapers/runner.ts";
import type { MerchantAdapter } from "../server/scrapers/types.ts";

const dryRun = process.argv.includes("--dry-run");
const allowWrites = process.argv.includes("--allow-writes");
const pilot = process.argv.includes("--pilot");
const all = process.argv.includes("--all");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const offerIdArg = process.argv.find((arg) => arg.startsWith("--offer-id="));
const merchantArg = process.argv.find((arg) => arg.startsWith("--merchant="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 10;
const offerId = offerIdArg ? Number(offerIdArg.split("=")[1]) : null;
const merchantSlug = merchantArg?.split("=")[1] ?? null;
const adapters: Record<string, MerchantAdapter> = {
  jiji: jijiAdapter,
  jumia: jumiaAdapter,
  kanta: kantaAdapter,
  tilyexpress: tilyexpressAdapter,
};
const prisma = createDevPrismaClient();

function assertValidArgs() {
  if (offerId && (pilot || all)) {
    throw new Error("Use either --offer-id=<id>, --pilot, or --all.");
  }

  if (!offerId && !pilot && !all) {
    throw new Error("Pass --offer-id=<id>, --pilot, or --all.");
  }

  if (pilot && (!Number.isInteger(limit) || limit <= 0)) {
    throw new Error("--limit must be a positive integer for pilot runs.");
  }

  if (merchantSlug && !adapters[merchantSlug]) {
    throw new Error(`No Phase 4G adapter is registered for merchant ${merchantSlug}.`);
  }
}

async function getOfferIds() {
  if (offerId) {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      select: {
        id: true,
        merchant: {
          select: {
            slug: true,
            enabled: true,
            scrapeStrategy: true,
          },
        },
        url: true,
      },
    });

    if (!offer?.url) throw new Error(`Offer ${offerId} does not have a URL.`);
    if (!offer.merchant) throw new Error(`Offer ${offerId} is not linked to a merchant.`);
    if (!adapters[offer.merchant.slug]) {
      throw new Error(`No adapter registered for merchant ${offer.merchant.slug}.`);
    }
    if (!offer.merchant.enabled || offer.merchant.scrapeStrategy !== "fetch-html") {
      throw new Error(`Merchant ${offer.merchant.slug} is not enabled for DEV scraping.`);
    }
    if (merchantSlug && offer.merchant.slug !== merchantSlug) {
      throw new Error(`Offer ${offerId} belongs to ${offer.merchant.slug}, not ${merchantSlug}.`);
    }

    return [offer.id];
  }

  if (pilot) {
    const merchantSlugs = merchantSlug
      ? [merchantSlug]
      : Object.keys(adapters).sort();
    const offersByMerchant = await Promise.all(
      merchantSlugs.map(async (slug) => {
        const offers = await prisma.offer.findMany({
          where: {
            url: {
              not: null,
            },
            merchant: {
              slug,
              enabled: true,
              scrapeStrategy: "fetch-html",
            },
          },
          orderBy: {
            id: "asc",
          },
          take: limit,
          select: {
            id: true,
          },
        });

        return offers.map((offer) => offer.id);
      }),
    );
    const selectedOfferIds: number[] = [];

    for (let index = 0; selectedOfferIds.length < limit; index += 1) {
      const nextOfferIds = offersByMerchant
        .map((offerIds) => offerIds[index])
        .filter((id): id is number => typeof id === "number");

      if (nextOfferIds.length === 0) break;

      selectedOfferIds.push(...nextOfferIds);
    }

    return selectedOfferIds.slice(0, limit);
  }

  const offers = await prisma.offer.findMany({
    where: {
      url: {
        not: null,
      },
      merchant: {
        slug: merchantSlug ? merchantSlug : { in: Object.keys(adapters) },
        enabled: true,
        scrapeStrategy: "fetch-html",
      },
    },
    orderBy: [
      {
        merchant: {
          slug: "asc",
        },
      },
      {
        id: "asc",
      },
    ],
    select: {
      id: true,
    },
  });

  return offers.map((offer) => offer.id);
}

async function main() {
  assertValidArgs();

  const offerIds = await getOfferIds();

  if (offerIds.length === 0) {
    throw new Error("No enabled DEV offers found for Phase 4G scraping.");
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        merchantSlug: merchantSlug ?? "all",
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
    throw new Error("Phase 4G scrape writes require --allow-writes.");
  }

  const scrapeRun = await runScrapeForOffers({
    prisma,
    offerIds,
    adapters,
    source: offerId
      ? "phase-4g-offer"
      : pilot
        ? `phase-4g-pilot-${offerIds.length}`
        : "phase-4g-all-enabled",
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
