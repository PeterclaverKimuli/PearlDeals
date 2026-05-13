import type { PrismaClient } from "@prisma/client";
import { validateScrapeResult } from "./validation.js";
import type { MerchantAdapter, ScrapeResult } from "./types.js";

type ScrapeOffer = {
  id: number;
  price: number;
  url: string | null;
  status: string | null;
  canonicalUrl: string | null;
  product: {
    title: string;
  };
  merchant: {
    id: number;
    slug: string;
    baseUrl: string | null;
  } | null;
};

type RunScrapeOptions = {
  prisma: PrismaClient;
  offerIds: number[];
  adapters: Record<string, MerchantAdapter>;
  source: string;
};

function getDurationMs(startedAt: Date) {
  return Date.now() - startedAt.getTime();
}

function getFailureMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown scrape error";
}

async function scrapeOffer({
  adapter,
  offer,
}: {
  adapter: MerchantAdapter;
  offer: ScrapeOffer;
}): Promise<ScrapeResult> {
  if (!offer.url) {
    throw new Error("Offer has no URL to scrape.");
  }

  return adapter.scrapeOffer(offer.url);
}

export async function runScrapeForOffers({
  prisma,
  offerIds,
  adapters,
  source,
}: RunScrapeOptions) {
  const scrapeRun = await prisma.scrapeRun.create({
    data: {
      status: "running",
      totalJobs: offerIds.length,
      metadata: { source },
    },
  });
  let successCount = 0;
  let failureCount = 0;

  for (const offerId of offerIds) {
    const startedAt = new Date();
    const offer = (await prisma.offer.findUnique({
      where: { id: offerId },
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
    })) as ScrapeOffer | null;

    if (!offer) {
      failureCount += 1;
      continue;
    }

    const adapter = offer.merchant ? adapters[offer.merchant.slug] : undefined;

    try {
      if (!offer.merchant) {
        throw new Error("Offer is not linked to a merchant.");
      }

      if (!adapter) {
        throw new Error(`No adapter registered for merchant ${offer.merchant.slug}.`);
      }

      const result = await scrapeOffer({ adapter, offer });
      const validation = validateScrapeResult(offer, result);
      const completedAt = new Date();
      const jobStatus = validation.valid
        ? validation.warnings.length > 0
          ? "warning"
          : "success"
        : "failed";

      await prisma.scrapeJob.create({
        data: {
          runId: scrapeRun.id,
          offerId: offer.id,
          merchantId: offer.merchant.id,
          status: jobStatus,
          errorReason:
            [...validation.errors, ...validation.warnings].join(" | ") || null,
          durationMs: getDurationMs(startedAt),
          startedAt,
          completedAt,
        },
      });

      await prisma.offer.update({
        where: { id: offer.id },
        data: validation.valid
          ? {
              price: result.price,
              original: result.original ?? result.price,
              status: result.condition ?? offer.status,
              availability: result.availability,
              canonicalUrl: result.canonicalUrl ?? offer.canonicalUrl,
              lastScrapedAt: completedAt,
              lastSuccessfulScrapeAt: completedAt,
              failureCount: 0,
              scrapeStatus: jobStatus,
            }
          : {
              lastScrapedAt: completedAt,
              failureCount: { increment: 1 },
              scrapeStatus: "failed",
            },
      });

      if (validation.valid) {
        await prisma.priceSnapshot.create({
          data: {
            offerId: offer.id,
            price: result.price,
            original: result.original ?? result.price,
            availability: result.availability,
            status: result.condition ?? offer.status,
            sourceUrl: result.canonicalUrl ?? offer.url,
          },
        });

        successCount += 1;
      } else {
        failureCount += 1;
      }
    } catch (error) {
      const completedAt = new Date();
      failureCount += 1;

      await prisma.scrapeJob.create({
        data: {
          runId: scrapeRun.id,
          offerId: offer.id,
          merchantId: offer.merchant?.id,
          status: "failed",
          errorReason: getFailureMessage(error),
          durationMs: getDurationMs(startedAt),
          startedAt,
          completedAt,
        },
      });

      await prisma.offer.update({
        where: { id: offer.id },
        data: {
          lastScrapedAt: completedAt,
          failureCount: { increment: 1 },
          scrapeStatus: "failed",
        },
      });
    }
  }

  const status =
    failureCount === 0 ? "success" : successCount === 0 ? "failed" : "partial";
  return prisma.scrapeRun.update({
    where: { id: scrapeRun.id },
    data: {
      status,
      completedAt: new Date(),
      successCount,
      failureCount,
    },
    include: {
      jobs: {
        orderBy: { id: "asc" },
      },
    },
  });
}
