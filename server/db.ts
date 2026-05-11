import "./env.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import type { Deal } from "../shared/deals/types.js";

let prisma: PrismaClient | null = null;

function getPrisma() {
  if (prisma) return prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const adapter = new PrismaPg({
    connectionString,
  });

  prisma = new PrismaClient({ adapter });
  return prisma;
}

type ProductWithOffers = {
  id: number;
  title: string;
  image: string;
  category: string;
  offers: {
    site: string;
    price: number;
    original: number;
    url: string | null;
    status: string | null;
  }[];
};

function productToDeal(product: ProductWithOffers): Deal {
  return {
    id: product.id,
    title: product.title,
    image: product.image,
    category: product.category,
    prices: product.offers.map((offer) => ({
      site: offer.site,
      price: offer.price,
      original: offer.original,
      url: offer.url ?? undefined,
      status: offer.status ?? undefined,
    })),
  };
}

export async function getCatalogDeals(): Promise<Deal[]> {
  const products = await getPrisma().product.findMany({
    orderBy: { id: "asc" },
    include: {
      offers: {
        orderBy: { id: "asc" },
      },
    },
  });

  return products.map(productToDeal);
}
