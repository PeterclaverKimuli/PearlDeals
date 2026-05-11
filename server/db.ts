import "./env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import type { Deal } from "../shared/deals/types";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });

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
  const products = await prisma.product.findMany({
    orderBy: { id: "asc" },
    include: {
      offers: {
        orderBy: { id: "asc" },
      },
    },
  });

  return products.map(productToDeal);
}
