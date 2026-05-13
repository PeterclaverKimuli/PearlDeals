import {
  decodeHtmlEntities,
  getCanonicalUrl,
  getMetaContent,
  getUgxPrices,
  parseUgxPrice,
  stripHtml,
} from "../parsing.js";
import { assertMerchantScrapingAllowed } from "../policy.js";
import type { Availability, MerchantAdapter, ScrapeCondition, ScrapeResult } from "../types.js";

const kantaHostPattern = /(^|\.)kanta\.ug$/i;

function assertKantaUrl(url: string) {
  const parsedUrl = new URL(url);

  if (!kantaHostPattern.test(parsedUrl.hostname)) {
    throw new Error(`Kanta adapter cannot scrape non-Kanta URL: ${url}`);
  }
}

function getJsonLdBlocks(html: string) {
  return Array.from(
    html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  )
    .map((match) => match[1]?.trim())
    .filter((value): value is string => !!value);
}

function findProductNode(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const product = findProductNode(item);
      if (product) return product;
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  const type = record["@type"];
  const types = Array.isArray(type) ? type : [type];

  if (types.some((candidate) => candidate === "Product")) {
    return record;
  }

  for (const child of Object.values(record)) {
    const product = findProductNode(child);
    if (product) return product;
  }

  return null;
}

function getProductJsonLd(html: string) {
  for (const block of getJsonLdBlocks(html)) {
    try {
      const product = findProductNode(JSON.parse(decodeHtmlEntities(block)));
      if (product) return product;
    } catch {
      // Ignore malformed third-party JSON-LD blocks and fall back to HTML parsing.
    }
  }

  return null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getOffer(product: Record<string, unknown> | null) {
  const offers = product?.offers;
  if (!offers || typeof offers !== "object") return null;

  return Array.isArray(offers)
    ? (offers.find((offer) => offer && typeof offer === "object") as
        | Record<string, unknown>
        | undefined) ?? null
    : (offers as Record<string, unknown>);
}

function extractTitle(html: string, product: Record<string, unknown> | null) {
  const productName = asString(product?.name);
  if (productName) return productName.replace(/^Buy\s+/i, "").replace(/\s+in Uganda$/i, "").trim();

  const ogTitle = getMetaContent(html, "og:title");
  if (ogTitle) return ogTitle.replace(/^Buy\s+/i, "").replace(/\s+in Uganda$/i, "").trim();

  const headingMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (headingMatch?.[1]) return stripHtml(headingMatch[1]);

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) return stripHtml(titleMatch[1]).replace(/^Buy\s+/i, "").replace(/\s+in Uganda$/i, "").trim();

  return "";
}

function extractPrice(html: string, offer: Record<string, unknown> | null) {
  const offerPrice = Number(offer?.price);
  if (Number.isInteger(offerPrice) && offerPrice > 0) return offerPrice;

  const metaPrice = getMetaContent(html, "product:price:amount");
  const parsedMetaPrice = metaPrice ? Number(metaPrice.replace(/,/g, "")) : null;
  if (parsedMetaPrice && Number.isInteger(parsedMetaPrice) && parsedMetaPrice > 0) {
    return parsedMetaPrice;
  }

  const classPriceMatch = html.match(
    /<[^>]+class=["'][^"']*(?:price|amount)[^"']*["'][^>]*>([\s\S]*?(?:UGX|USh|[\d,]+)[\s\S]*?)<\/[^>]+>/i,
  );
  const classPrice = classPriceMatch?.[1]
    ? parseUgxPrice(stripHtml(classPriceMatch[1]))
    : null;

  if (classPrice) return classPrice;

  return getUgxPrices(stripHtml(html))[0] ?? null;
}

function extractOriginalPrice(html: string, price: number) {
  const prices = getUgxPrices(stripHtml(html));
  return prices.find((candidate) => candidate > price) ?? undefined;
}

function extractAvailability(
  html: string,
  offer: Record<string, unknown> | null,
): Availability {
  const structuredAvailability = asString(offer?.availability)?.toLowerCase();

  if (structuredAvailability?.includes("outofstock")) return "out_of_stock";
  if (structuredAvailability?.includes("instock")) return "in_stock";

  const twitterAvailability = getMetaContent(html, "twitter:data2")?.toLowerCase();
  if (twitterAvailability?.includes("out of stock")) return "out_of_stock";
  if (twitterAvailability?.includes("in stock")) return "in_stock";

  const text = stripHtml(html).toLowerCase();
  if (text.includes("out of stock")) return "out_of_stock";
  if (text.includes("in stock") || text.includes("add to cart")) return "in_stock";
  return "unknown";
}

function extractCondition(offer: Record<string, unknown> | null): ScrapeCondition {
  const itemCondition = asString(offer?.itemCondition)?.toLowerCase();

  if (itemCondition?.includes("used")) return "Used";
  if (itemCondition?.includes("refurbished")) return "Refurbished";
  return "New";
}

function extractImage(html: string, product: Record<string, unknown> | null) {
  const image = product?.image;
  if (typeof image === "string") return image;

  if (Array.isArray(image)) {
    const firstImage = image.find((item) => {
      if (typeof item === "string") return true;
      return !!(
        item &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>).url === "string"
      );
    });

    if (typeof firstImage === "string") return firstImage;
    if (firstImage && typeof firstImage === "object") {
      const imageUrl = asString((firstImage as Record<string, unknown>).url);
      if (imageUrl) return imageUrl;
    }
  }

  const ogImage = getMetaContent(html, "og:image");
  return ogImage ? decodeHtmlEntities(ogImage) : undefined;
}

export function parseKantaProductPage(html: string, sourceUrl: string): ScrapeResult {
  const product = getProductJsonLd(html);
  const offer = getOffer(product);
  const title = extractTitle(html, product);
  const price = extractPrice(html, offer);

  if (!price) {
    throw new Error("Could not extract Kanta product price.");
  }

  return {
    title,
    price,
    original: extractOriginalPrice(html, price),
    image: extractImage(html, product),
    availability: extractAvailability(html, offer),
    condition: extractCondition(offer),
    canonicalUrl: getCanonicalUrl(html, sourceUrl),
  };
}

export const kantaAdapter: MerchantAdapter = {
  merchantSlug: "kanta",
  async scrapeOffer(url: string) {
    assertKantaUrl(url);
    const policy = assertMerchantScrapingAllowed("kanta");
    const response = await fetch(url, {
      headers: {
        "User-Agent": policy.userAgent,
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(`Kanta returned HTTP ${response.status} for ${url}`);
    }

    return parseKantaProductPage(await response.text(), url);
  },
};
