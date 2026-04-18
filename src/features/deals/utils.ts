import { rawDeals, imageFallback } from "./data";
import type { CategoryItem, Deal, EnrichedDeal, PriceEntry, RawDeal } from "./types";

function normalizeText(value: string | undefined, fallback: string) {
  if (!value) return fallback;

  return value
    .replace(/â€“/g, "–")
    .replace(/â€”/g, "—")
    .replace(/â€˜/g, "‘")
    .replace(/â€™/g, "’")
    .replace(/â€œ/g, "“")
    .replace(/â€/g, "”");
}

export function normalizeDeals(input: RawDeal[]): Deal[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter((deal): deal is RawDeal => !!deal && typeof deal === "object")
    .map((deal) => {
      const safePrices = Array.isArray(deal.prices)
        ? deal.prices
            .filter(
              (price): price is PriceEntry =>
                !!price && typeof price.price === "number",
            )
            .map((price) => ({
              site: price.site || "Unknown site",
              price: typeof price.price === "number" ? price.price : 0,
              original:
                typeof price.original === "number"
                  ? price.original
                  : price.price || 0,
              url: price.url,
              status: price.status,
            }))
        : [];

      return {
        id: typeof deal.id === "number" ? deal.id : Math.random(),
        title: normalizeText(deal.title, "Untitled product"),
        image: deal.image || imageFallback,
        category: normalizeText(deal.category, "Other"),
        prices: safePrices,
      };
    })
    .filter((deal) => deal.prices.length > 0);
}

export const mockDeals = normalizeDeals(rawDeals);

export function getCategoryIcon(category: string) {
  switch (category) {
    case "Phones":
      return "\u{1F4F1}";
    case "Computers":
      return "\u{1F4BB}";
    case "Monitors":
      return "\u{1F5A5}\uFE0F";
    case "Accessories":
      return "\u{1F50C}";
    case "TVs":
      return "\u{1F4FA}";
    case "Appliances":
      return "\u{1F9CA}";
    case "Kitchen":
      return "\u{1F373}";
    default:
      return "\u{1F6CD}\uFE0F";
  }
}

export function getVisibleCategories(deals: Deal[]): CategoryItem[] {
  if (!Array.isArray(deals) || deals.length === 0) return [];

  const uniqueNames = Array.from(
    new Set(deals.map((deal) => deal.category).filter(Boolean)),
  );

  return uniqueNames.map((name) => ({ name, icon: getCategoryIcon(name) }));
}

export function formatUGX(value: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(value);
}

export function enrichDeal(deal: Deal): EnrichedDeal {
  const fallbackPrice: PriceEntry = deal.prices[0] ?? {
    site: "Unknown site",
    price: 0,
    original: 0,
  };

  const bestPrice =
    deal.prices.length > 0 ? Math.min(...deal.prices.map((p) => p.price)) : 0;
  const bestDeal =
    deal.prices.find((p) => p.price === bestPrice) ?? fallbackPrice;
  const discount =
    bestDeal.original > 0
      ? Math.max(
          0,
          Math.round(
            ((bestDeal.original - bestDeal.price) / bestDeal.original) * 100,
          ),
        )
      : 0;

  return {
    ...deal,
    bestDeal,
    discount,
  };
}

export function getShareUrl() {
  if (typeof window === "undefined") {
    return "https://pearldeals.app/product";
  }

  return window.location.href || "https://pearldeals.app/product";
}

async function copyTextToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy copy method below.
    }
  }

  if (typeof document !== "undefined") {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "-9999px";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, text.length);

      const copied = document.execCommand("copy");
      document.body.removeChild(textArea);
      return copied;
    } catch {
      return false;
    }
  }

  return false;
}

export async function shareDeal(deal: EnrichedDeal) {
  const shareUrl = getShareUrl();
  const shareData = {
    title: deal.title,
    text: `Check out this deal for ${deal.title}`,
    url: shareUrl,
  };

  const isMobileLikeDevice =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(pointer: coarse)")?.matches ||
      window.innerWidth < 768);

  if (
    isMobileLikeDevice &&
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function"
  ) {
    try {
      await navigator.share(shareData);
      return "shared";
    } catch (error) {
      const err = error as { name?: string } | undefined;
      if (err?.name === "AbortError") {
        return "cancelled";
      }

      const copied = await copyTextToClipboard(shareUrl);
      return copied ? "copied" : "failed";
    }
  }

  const copied = await copyTextToClipboard(shareUrl);
  return copied ? "copied" : "failed";
}
