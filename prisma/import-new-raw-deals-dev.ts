import { rawDeals } from "../src/features/deals/data.ts";
import { normalizeDeals } from "../shared/deals/logic.ts";
import { createDevPrismaClient } from "./dev-database.ts";
import { createMerchantSlug, inferMerchantBaseUrl } from "./merchant-utils.ts";

const dryRun = process.argv.includes("--dry-run");
const prisma = createDevPrismaClient();
const deals = normalizeDeals(rawDeals);

async function main() {
  const existingProductIds = new Set(
    (
      await prisma.product.findMany({
        where: {
          id: {
            in: deals.map((deal) => deal.id),
          },
        },
        select: { id: true },
      })
    ).map((product) => product.id),
  );
  const missingDeals = deals.filter((deal) => !existingProductIds.has(deal.id));

  console.log(`Raw deals in source: ${deals.length}`);
  console.log(`Missing DEV products to import: ${missingDeals.length}`);
  missingDeals.forEach((deal) => {
    console.log(`- ${deal.id}: ${deal.title}`);
  });

  if (dryRun) {
    console.log("Dry run complete. No database writes were made.");
    return;
  }

  for (const deal of missingDeals) {
    await prisma.product.create({
      data: {
        id: deal.id,
        title: deal.title,
        image: deal.image,
        category: deal.category,
        offers: {
          create: await Promise.all(
            deal.prices.map(async (price) => {
              const slug = createMerchantSlug(price.site);
              const merchant = await prisma.merchant.upsert({
                where: { slug },
                update: {
                  name: price.site,
                  baseUrl: inferMerchantBaseUrl(price.site, price.url),
                },
                create: {
                  name: price.site,
                  slug,
                  baseUrl: inferMerchantBaseUrl(price.site, price.url),
                },
              });

              return {
                merchantId: merchant.id,
                site: price.site,
                price: price.price,
                original: price.original,
                url: price.url,
                status: price.status,
                canonicalUrl: price.url,
              };
            }),
          ),
        },
      },
    });
  }

  const productCount = await prisma.product.count({
    where: {
      id: {
        lt: 10_000,
      },
    },
  });
  const offerCount = await prisma.offer.count({
    where: {
      productId: {
        lt: 10_000,
      },
    },
  });

  console.log(
    `Imported ${missingDeals.length} missing raw deals into DEV. Raw product count: ${productCount}. Raw offer count: ${offerCount}.`,
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
