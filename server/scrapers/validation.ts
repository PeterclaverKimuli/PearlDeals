import type { ScrapeResult, ScrapeValidation } from "./types.js";

type OfferForValidation = {
  price: number;
  url: string | null;
  product: {
    title: string;
  };
  merchant: {
    baseUrl: string | null;
  } | null;
};

const titleStopWords = new Set([
  "and",
  "for",
  "inch",
  "inches",
  "new",
  "the",
  "with",
]);

function isPositiveInteger(value: number | undefined) {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function getHostname(value: string | null | undefined) {
  if (!value) return null;

  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function tokenizeTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !titleStopWords.has(token));
}

function titlesLooselyMatch(expected: string, actual: string) {
  const expectedTokens = new Set(tokenizeTitle(expected));
  const actualTokens = new Set(tokenizeTitle(actual));

  if (expectedTokens.size === 0 || actualTokens.size === 0) return false;

  const sharedCount = Array.from(expectedTokens).filter((token) =>
    actualTokens.has(token),
  ).length;
  const smallerTitleTokenCount = Math.min(expectedTokens.size, actualTokens.size);

  return sharedCount >= 2 || sharedCount / smallerTitleTokenCount >= 0.35;
}

function hasExtremePriceChange(currentPrice: number, scrapedPrice: number) {
  if (currentPrice <= 0) return false;

  const ratio = Math.abs(scrapedPrice - currentPrice) / currentPrice;
  return ratio >= 0.6;
}

export function validateScrapeResult(
  offer: OfferForValidation,
  result: ScrapeResult,
): ScrapeValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!result.title.trim()) {
    errors.push("Scraped title is empty.");
  }

  if (!isPositiveInteger(result.price)) {
    errors.push("Scraped price must be a positive integer.");
  }

  if (result.original !== undefined && !isPositiveInteger(result.original)) {
    errors.push("Scraped original price must be a positive integer when present.");
  }

  if (
    result.original !== undefined &&
    isPositiveInteger(result.original) &&
    isPositiveInteger(result.price) &&
    result.original < result.price
  ) {
    warnings.push("Scraped original price is lower than scraped price.");
  }

  if (result.title.trim() && !titlesLooselyMatch(offer.product.title, result.title)) {
    errors.push("Scraped title does not match the stored product title.");
  }

  const expectedHost = getHostname(offer.merchant?.baseUrl ?? offer.url);
  const actualHost = getHostname(result.canonicalUrl ?? offer.url);

  if (expectedHost && actualHost && expectedHost !== actualHost) {
    errors.push(
      `Scraped URL host ${actualHost} does not match expected host ${expectedHost}.`,
    );
  }

  if (isPositiveInteger(result.price) && hasExtremePriceChange(offer.price, result.price)) {
    warnings.push("Scraped price changed by 60% or more from the current offer.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
