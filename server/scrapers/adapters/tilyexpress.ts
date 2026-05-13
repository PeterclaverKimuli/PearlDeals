import {
  decodeHtmlEntities,
  getCanonicalUrl,
  getMetaContent,
  getUgxPrices,
  stripHtml,
} from "../parsing.js";
import { assertMerchantScrapingAllowed } from "../policy.js";
import type { Availability, MerchantAdapter, ScrapeCondition, ScrapeResult } from "../types.js";

const tilyexpressHostPattern = /(^|\.)tilyexpress\.ug$/i;

function assertTilyexpressUrl(url: string) {
  const parsedUrl = new URL(url);

  if (!tilyexpressHostPattern.test(parsedUrl.hostname)) {
    throw new Error(`Tilyexpress adapter cannot scrape non-Tilyexpress URL: ${url}`);
  }
}

function extractTitle(html: string) {
  const ogTitle = getMetaContent(html, "og:title");
  if (ogTitle) {
    return ogTitle.replace(/\s*\|\s*TilyExpress Uganda\s*$/i, "").trim();
  }

  const headingMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (headingMatch?.[1]) return stripHtml(headingMatch[1]);

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) {
    return stripHtml(titleMatch[1])
      .replace(/\s*\|\s*TilyExpress Uganda\s*$/i, "")
      .trim();
  }

  return "";
}

function extractPrice(html: string) {
  const metaPrice = getMetaContent(html, "product:price:amount");
  const parsedMetaPrice = metaPrice ? Number(metaPrice.replace(/,/g, "")) : null;

  if (parsedMetaPrice && Number.isInteger(parsedMetaPrice) && parsedMetaPrice > 0) {
    return parsedMetaPrice;
  }

  return getUgxPrices(stripHtml(html))[0] ?? null;
}

function extractOriginalPrice(html: string, price: number) {
  const prices = getUgxPrices(stripHtml(html));
  return prices.find((candidate) => candidate > price) ?? undefined;
}

function extractAvailability(html: string): Availability {
  const availability = (
    getMetaContent(html, "product:availability") ??
    getMetaContent(html, "og:availability") ??
    getMetaContent(html, "twitter:data2") ??
    ""
  ).toLowerCase();

  if (availability.includes("out of stock")) return "out_of_stock";
  if (availability.includes("in stock")) return "in_stock";

  const text = stripHtml(html).toLowerCase();
  if (text.includes("out of stock")) return "out_of_stock";
  if (text.includes("in stock") || text.includes("add to cart")) return "in_stock";
  return "unknown";
}

function extractCondition(html: string): ScrapeCondition {
  const condition = (getMetaContent(html, "product:condition") ?? "").toLowerCase();

  if (condition.includes("used")) return "Used";
  if (condition.includes("refurbished")) return "Refurbished";
  return "New";
}

function extractImage(html: string) {
  const image = getMetaContent(html, "og:image");
  return image ? decodeHtmlEntities(image) : undefined;
}

export function parseTilyexpressProductPage(
  html: string,
  sourceUrl: string,
): ScrapeResult {
  const title = extractTitle(html);
  const price = extractPrice(html);

  if (!price) {
    throw new Error("Could not extract Tilyexpress product price.");
  }

  return {
    title,
    price,
    original: extractOriginalPrice(html, price),
    image: extractImage(html),
    availability: extractAvailability(html),
    condition: extractCondition(html),
    canonicalUrl: getCanonicalUrl(html, sourceUrl),
  };
}

export const tilyexpressAdapter: MerchantAdapter = {
  merchantSlug: "tilyexpress",
  async scrapeOffer(url: string) {
    assertTilyexpressUrl(url);
    const policy = assertMerchantScrapingAllowed("tilyexpress");
    const response = await fetch(url, {
      headers: {
        "User-Agent": policy.userAgent,
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(`Tilyexpress returned HTTP ${response.status} for ${url}`);
    }

    return parseTilyexpressProductPage(await response.text(), url);
  },
};
