import { lookup } from "node:dns/promises";
import {
  decodeHtmlEntities,
  getCanonicalUrl,
  getMetaContent,
  getUgxPrices,
  stripHtml,
} from "./scrapers/parsing.js";
import { jijiAdapter } from "./scrapers/adapters/jiji.js";
import { jumiaAdapter } from "./scrapers/adapters/jumia.js";
import { kantaAdapter } from "./scrapers/adapters/kanta.js";
import { tilyexpressAdapter } from "./scrapers/adapters/tilyexpress.js";
import type { MerchantAdapter, ScrapeResult } from "./scrapers/types.js";
import type { AdminScrapeProbeResult } from "../shared/admin/types.js";

const maxProbeBytes = 1_000_000;
const probeTimeoutMs = 8_000;
const knownAdapters = [
  jumiaAdapter,
  kantaAdapter,
  tilyexpressAdapter,
  jijiAdapter,
];

function emptyProbeResult(
  url: string,
  errors: string[],
): AdminScrapeProbeResult {
  return {
    scrapeable: false,
    url,
    merchantCandidate: null,
    strategy: "none",
    title: null,
    image: null,
    price: null,
    original: null,
    status: null,
    availability: null,
    canonicalUrl: null,
    warnings: [],
    errors,
  };
}

function resultFromScrape({
  url,
  merchantCandidate,
  strategy,
  result,
  warnings = [],
}: {
  url: string;
  merchantCandidate: string | null;
  strategy: AdminScrapeProbeResult["strategy"];
  result: ScrapeResult;
  warnings?: string[];
}): AdminScrapeProbeResult {
  return {
    scrapeable: true,
    url,
    merchantCandidate,
    strategy,
    title: result.title || null,
    image: result.image ?? null,
    price: result.price,
    original: result.original ?? null,
    status: result.condition ?? null,
    availability: result.availability,
    canonicalUrl: result.canonicalUrl ?? url,
    warnings,
    errors: [],
  };
}

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;

  const [first, second] = parts;
  return (
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254) ||
    first === 0
  );
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

async function assertSafeProbeUrl(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs can be probed.");
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("Localhost URLs cannot be probed.");
  }

  const addresses = await lookup(hostname, { all: true });
  if (addresses.length === 0) {
    throw new Error("URL hostname could not be resolved.");
  }

  const unsafeAddress = addresses.find((address) =>
    address.family === 4
      ? isPrivateIpv4(address.address)
      : isPrivateIpv6(address.address),
  );
  if (unsafeAddress) {
    throw new Error("Private or internal network URLs cannot be probed.");
  }
}

function getKnownAdapter(url: URL): MerchantAdapter | null {
  const hostname = url.hostname.toLowerCase();
  if (hostname.endsWith("jumia.ug")) return jumiaAdapter;
  if (hostname.endsWith("kanta.ug")) return kantaAdapter;
  if (hostname.endsWith("tilyexpress.ug")) return tilyexpressAdapter;
  if (hostname.endsWith("jiji.ug")) return jijiAdapter;

  return null;
}

async function fetchProbeHtml(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(probeTimeoutMs),
    headers: {
      "User-Agent":
        "PearlDealsBot/0.1 (+https://pearldeals.local; contact: pearldeals-dev)",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`URL returned HTTP ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType && !contentType.toLowerCase().includes("html")) {
    throw new Error("URL did not return an HTML page.");
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > maxProbeBytes) {
    throw new Error("URL response is too large to probe.");
  }

  const html = await response.text();
  if (html.length > maxProbeBytes) {
    throw new Error("URL response is too large to probe.");
  }

  return html;
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
  if (types.some((candidate) => candidate === "Product")) return record;

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
      // Ignore malformed JSON-LD and continue with generic HTML parsing.
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

function getImage(product: Record<string, unknown> | null, html: string) {
  const image = product?.image;
  if (typeof image === "string") return image;
  if (Array.isArray(image)) {
    const firstString = image.find((item) => typeof item === "string");
    if (typeof firstString === "string") return firstString;
  }

  const ogImage = getMetaContent(html, "og:image");
  return ogImage ? decodeHtmlEntities(ogImage) : undefined;
}

function getGenericTitle(product: Record<string, unknown> | null, html: string) {
  const productName = asString(product?.name);
  if (productName) return productName;

  const ogTitle = getMetaContent(html, "og:title");
  if (ogTitle) return ogTitle;

  const headingMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (headingMatch?.[1]) return stripHtml(headingMatch[1]);

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return titleMatch?.[1] ? stripHtml(titleMatch[1]) : "";
}

function getGenericPrice(
  offer: Record<string, unknown> | null,
  html: string,
) {
  const offerPrice = Number(offer?.price);
  if (Number.isInteger(offerPrice) && offerPrice > 0) return offerPrice;

  const metaPrice = getMetaContent(html, "product:price:amount");
  const parsedMetaPrice = metaPrice ? Number(metaPrice.replace(/,/g, "")) : null;
  if (parsedMetaPrice && Number.isInteger(parsedMetaPrice) && parsedMetaPrice > 0) {
    return parsedMetaPrice;
  }

  return getUgxPrices(stripHtml(html))[0] ?? null;
}

function getGenericAvailability(
  offer: Record<string, unknown> | null,
  html: string,
): ScrapeResult["availability"] {
  const structuredAvailability = asString(offer?.availability)?.toLowerCase();
  const metaAvailability = (
    getMetaContent(html, "product:availability") ??
    getMetaContent(html, "og:availability") ??
    ""
  ).toLowerCase();
  const availability = structuredAvailability ?? metaAvailability;

  if (availability.includes("outofstock") || availability.includes("out of stock")) {
    return "out_of_stock";
  }
  if (availability.includes("instock") || availability.includes("in stock")) {
    return "in_stock";
  }

  const text = stripHtml(html).toLowerCase();
  if (text.includes("out of stock")) return "out_of_stock";
  if (text.includes("in stock") || text.includes("add to cart")) return "in_stock";
  return "unknown";
}

function getGenericCondition(
  offer: Record<string, unknown> | null,
): ScrapeResult["condition"] {
  const condition = asString(offer?.itemCondition)?.toLowerCase();

  if (condition?.includes("used")) return "Used";
  if (condition?.includes("refurbished")) return "Refurbished";
  if (condition?.includes("new")) return "New";
  return undefined;
}

function parseGenericProductPage(html: string, url: string): ScrapeResult {
  const product = getProductJsonLd(html);
  const offer = getOffer(product);
  const title = getGenericTitle(product, html);
  const price = getGenericPrice(offer, html);

  if (!title) throw new Error("Could not extract product title.");
  if (!price) throw new Error("Could not extract product price.");

  const prices = getUgxPrices(stripHtml(html));
  return {
    title,
    price,
    original: prices.find((candidate) => candidate > price),
    image: getImage(product, html),
    availability: getGenericAvailability(offer, html),
    condition: getGenericCondition(offer),
    canonicalUrl: getCanonicalUrl(html, url),
  };
}

export async function probeScrapeUrl(
  rawUrl: string,
): Promise<AdminScrapeProbeResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return emptyProbeResult(rawUrl, ["Invalid URL."]);
  }

  try {
    await assertSafeProbeUrl(parsedUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unsafe URL.";
    return emptyProbeResult(rawUrl, [message]);
  }

  const adapter = getKnownAdapter(parsedUrl);
  if (adapter) {
    try {
      const result = await adapter.scrapeOffer(parsedUrl.toString());
      return resultFromScrape({
        url: parsedUrl.toString(),
        merchantCandidate: adapter.merchantSlug,
        strategy: "known_adapter",
        result,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Known adapter probe failed.";
      return {
        ...emptyProbeResult(parsedUrl.toString(), [message]),
        merchantCandidate: adapter.merchantSlug,
        strategy: "known_adapter",
      };
    }
  }

  try {
    const html = await fetchProbeHtml(parsedUrl.toString());
    const result = parseGenericProductPage(html, parsedUrl.toString());
    return resultFromScrape({
      url: parsedUrl.toString(),
      merchantCandidate: parsedUrl.hostname,
      strategy: "generic",
      result,
      warnings: [
        "Generic probe succeeded. Create a dedicated adapter before scheduled scraping.",
      ],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Generic probe failed.";
    return {
      ...emptyProbeResult(parsedUrl.toString(), [message]),
      merchantCandidate: parsedUrl.hostname,
      strategy: "generic",
    };
  }
}

export function getKnownProbeAdapters() {
  return knownAdapters.map((adapter) => adapter.merchantSlug);
}
