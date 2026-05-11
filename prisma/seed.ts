import "dotenv/config";
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { rawDeals } from "../src/features/deals/data";
import { normalizeDeals } from "../shared/deals/logic";

config({ path: ".env.local" });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });
const deals = normalizeDeals(rawDeals);

async function main() {
  for (const deal of deals) {
    await prisma.product.upsert({
      where: { id: deal.id },
      update: {
        title: deal.title,
        image: deal.image,
        category: deal.category,
        offers: {
          deleteMany: {},
          create: deal.prices.map((price) => ({
            site: price.site,
            price: price.price,
            original: price.original,
            url: price.url,
            status: price.status,
          })),
        },
      },
      create: {
        id: deal.id,
        title: deal.title,
        image: deal.image,
        category: deal.category,
        offers: {
          create: deal.prices.map((price) => ({
            site: price.site,
            price: price.price,
            original: price.original,
            url: price.url,
            status: price.status,
          })),
        },
      },
    });
  }

  const productCount = await prisma.product.count();
  const offerCount = await prisma.offer.count();
  console.log(`Seeded ${productCount} products and ${offerCount} offers.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
