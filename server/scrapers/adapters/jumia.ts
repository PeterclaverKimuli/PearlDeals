import {
  decodeHtmlEntities,
  getCanonicalUrl,
  getMetaContent,
  getUgxPrices,
  parseUgxPrice,
  stripHtml,
} from "../parsing.js";
import { assertMerchantScrapingAllowed } from "../policy.js";
import type { MerchantAdapter, ScrapeResult } from "../types.js";

const jumiaHostPattern = /(^|\.)jumia\.ug$/i;

function assertJumiaUrl(url: string) {
  const parsedUrl = new URL(url);

  if (!jumiaHostPattern.test(parsedUrl.hostname)) {
    throw new Error(`Jumia adapter cannot scrape non-Jumia URL: ${url}`);
  }
}

function extractTitle(html: string) {
  const headingMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (headingMatch?.[1]) return stripHtml(headingMatch[1]);

  const ogTitle = getMetaContent(html, "og:title");
  if (ogTitle) return ogTitle.replace(/\s*\|\s*Jumia Uganda\s*$/i, "").trim();

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) {
    return stripHtml(titleMatch[1]).replace(/\s*\|\s*Jumia Uganda\s*$/i, "").trim();
  }

  return "";
}

function extractPrice(html: string) {
  const priceClassMatch = html.match(
    /<[^>]+class=["'][^"']*(?:-b|-fs24|prc)[^"']*["'][^>]*>([\s\S]*?UGX\s*[\d,]+[\s\S]*?)<\/[^>]+>/i,
  );
  const classPrice = priceClassMatch?.[1]
    ? parseUgxPrice(stripHtml(priceClassMatch[1]))
    : null;

  if (classPrice) return classPrice;

  return getUgxPrices(stripHtml(html))[0] ?? null;
}

function extractOriginalPrice(html: string, price: number) {
  const prices = getUgxPrices(stripHtml(html));
  return prices.find((candidate) => candidate > price) ?? undefined;
}

function extractAvailability(html: string): ScrapeResult["availability"] {
  const text = stripHtml(html).toLowerCase();

  if (text.includes("out of stock")) return "out_of_stock";
  if (text.includes("in stock") || text.includes("add to cart")) return "in_stock";
  return "unknown";
}

function extractImage(html: string) {
  const image = getMetaContent(html, "og:image");
  return image ? decodeHtmlEntities(image) : undefined;
}

export function parseJumiaProductPage(html: string, sourceUrl: string): ScrapeResult {
  const title = extractTitle(html);
  const price = extractPrice(html);

  if (!price) {
    throw new Error("Could not extract Jumia product price.");
  }

  return {
    title,
    price,
    original: extractOriginalPrice(html, price),
    image: extractImage(html),
    availability: extractAvailability(html),
    condition: "New",
    canonicalUrl: getCanonicalUrl(html, sourceUrl),
  };
}

export const jumiaAdapter: MerchantAdapter = {
  merchantSlug: "jumia",
  async scrapeOffer(url: string) {
    assertJumiaUrl(url);
    const policy = assertMerchantScrapingAllowed("jumia");
    const response = await fetch(url, {
      headers: {
        "User-Agent": policy.userAgent,
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(`Jumia returned HTTP ${response.status} for ${url}`);
    }

    return parseJumiaProductPage(await response.text(), url);
  },
};
