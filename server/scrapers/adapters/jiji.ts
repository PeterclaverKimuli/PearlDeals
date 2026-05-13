import {
  decodeHtmlEntities,
  getCanonicalUrl,
  getMetaContent,
  getUgxPrices,
  stripHtml,
} from "../parsing.js";
import { assertMerchantScrapingAllowed } from "../policy.js";
import type { Availability, MerchantAdapter, ScrapeCondition, ScrapeResult } from "../types.js";

const jijiHostPattern = /(^|\.)jiji\.ug$/i;

function assertJijiUrl(url: string) {
  const parsedUrl = new URL(url);

  if (!jijiHostPattern.test(parsedUrl.hostname)) {
    throw new Error(`Jiji adapter cannot scrape non-Jiji URL: ${url}`);
  }
}

function assertNotChallengePage(html: string) {
  const text = stripHtml(html).toLowerCase();

  if (
    text.includes("just a moment") &&
    text.includes("enable javascript and cookies to continue")
  ) {
    throw new Error("Jiji returned a Cloudflare challenge page.");
  }
}

function extractTitle(html: string) {
  const ogTitle = getMetaContent(html, "og:title");
  if (ogTitle) return ogTitle.replace(/\s+in\s+.+?\s+-\s+.+?\s+\|\s+Jiji\.ug$/i, "").trim();

  const headingMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (headingMatch?.[1]) return stripHtml(headingMatch[1]);

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) {
    return stripHtml(titleMatch[1])
      .replace(/\s+in\s+.+?\s+-\s+.+?\s+\|\s+Jiji\.ug$/i, "")
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

  const prices = getUgxPrices(stripHtml(html));
  return prices[0] ?? null;
}

function extractOriginalPrice(html: string, price: number) {
  const prices = getUgxPrices(stripHtml(html));
  return prices.find((candidate) => candidate > price) ?? undefined;
}

function extractAvailability(html: string): Availability {
  const text = stripHtml(html).toLowerCase();

  if (text.includes("mark unavailable") || text.includes("sold")) return "out_of_stock";
  return "unknown";
}

function extractCondition(html: string): ScrapeCondition | undefined {
  const text = stripHtml(html).toLowerCase();

  if (text.includes("brand new") || text.includes("condition brand new")) return "New";
  if (text.includes("refurbished") || text.includes("condition refurbished")) {
    return "Refurbished";
  }
  if (text.includes("used") || text.includes("condition used")) return "Used";
  return undefined;
}

function extractImage(html: string) {
  const image = getMetaContent(html, "og:image");
  return image ? decodeHtmlEntities(image) : undefined;
}

export function parseJijiListingPage(html: string, sourceUrl: string): ScrapeResult {
  assertNotChallengePage(html);

  const title = extractTitle(html);
  const price = extractPrice(html);

  if (!price) {
    throw new Error("Could not extract Jiji listing price.");
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

export const jijiAdapter: MerchantAdapter = {
  merchantSlug: "jiji",
  async scrapeOffer(url: string) {
    assertJijiUrl(url);
    const policy = assertMerchantScrapingAllowed("jiji");
    const response = await fetch(url, {
      headers: {
        "User-Agent": policy.userAgent,
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(`Jiji returned HTTP ${response.status} for ${url}`);
    }

    return parseJijiListingPage(await response.text(), url);
  },
};
