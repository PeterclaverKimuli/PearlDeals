import "./env.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import type { Deal } from "../shared/deals/types.js";
import { normalizeDecodedText } from "./scrapers/parsing.js";

let prisma: PrismaClient | null = null;
const visibleOfferWhere = {
  scrapeStatus: {
    not: "failed",
  },
};

function isProductionRuntime() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function getDatabaseUrl() {
  if (!isProductionRuntime() && process.env.DATABASE_URL_DEV) {
    return process.env.DATABASE_URL_DEV;
  }

  return process.env.DATABASE_URL;
}

export function getPrisma() {
  if (prisma) return prisma;

  const connectionString = getDatabaseUrl();
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
  hidden: boolean;
  offers: {
    site: string;
    price: number;
    original: number;
    url: string | null;
    status: string | null;
    merchant: {
      name: string;
    } | null;
  }[];
};

function productToDeal(product: ProductWithOffers): Deal {
  return {
    id: product.id,
    title: normalizeDecodedText(product.title),
    image: product.image,
    category: normalizeDecodedText(product.category),
    prices: product.offers.map((offer) => ({
      site: offer.merchant?.name ?? offer.site,
      price: offer.price,
      original: offer.original,
      url: offer.url ?? undefined,
      status: offer.status ?? "New",
    })),
  };
}

export async function getCatalogDeals(): Promise<Deal[]> {
  const products = await getPrisma().product.findMany({
    where: {
      hidden: false,
      offers: {
        some: visibleOfferWhere,
      },
    },
    orderBy: { id: "asc" },
    include: {
      offers: {
        where: visibleOfferWhere,
        orderBy: { id: "asc" },
        include: {
          merchant: true,
        },
      },
    },
  });

  return products.map(productToDeal);
}
