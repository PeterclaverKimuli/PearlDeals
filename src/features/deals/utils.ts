import { rawDeals, imageFallback } from "./data";
import type {
  CategoryItem,
  ConditionChoice,
  Deal,
  EnrichedDeal,
  PriceEntry,
  RawDeal,
  RecommendationBasket,
  RecommendationMatch,
  ShoppingBrief,
} from "./types";

const conditionChoices: ConditionChoice[] = ["New", "Refurbished", "Used", "All"];

function isConditionChoice(value: string | undefined): value is ConditionChoice {
  return !!value && conditionChoices.includes(value as ConditionChoice);
}

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
  return `UGX ${new Intl.NumberFormat("en-UG", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export function getSavingsAmount(deal: Pick<Deal, "prices">) {
  if (!deal.prices.length) return 0;

  const prices = deal.prices.map((price) => price.price);
  return Math.max(0, Math.max(...prices) - Math.min(...prices));
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

function dealMatchesConditions(deal: EnrichedDeal, brief: ShoppingBrief) {
  if (brief.conditions.includes("All")) return true;

  return deal.prices.some(
    (price) =>
      isConditionChoice(price.status) && brief.conditions.includes(price.status),
  );
}

function getEligiblePrices(deal: EnrichedDeal, brief: ShoppingBrief) {
  if (brief.conditions.includes("All")) return deal.prices;

  return deal.prices.filter(
    (price) =>
      isConditionChoice(price.status) && brief.conditions.includes(price.status),
  );
}

function getDealForBrief(deal: EnrichedDeal, brief: ShoppingBrief) {
  const eligiblePrices = getEligiblePrices(deal, brief);
  if (eligiblePrices.length === 0) return null;

  const bestPrice = Math.min(...eligiblePrices.map((price) => price.price));
  const bestDeal =
    eligiblePrices.find((price) => price.price === bestPrice) ?? eligiblePrices[0];
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

function getMatchingConditionLabels(deal: EnrichedDeal, brief: ShoppingBrief) {
  if (brief.conditions.includes("All")) return ["All conditions"];

  return brief.conditions.filter((condition) =>
    deal.prices.some((price) => price.status === condition),
  );
}

function getRecommendationReasons(deal: EnrichedDeal, brief: ShoppingBrief) {
  const reasons: string[] = [];
  const matchingConditions = getMatchingConditionLabels(deal, brief);

  if (deal.bestDeal.price <= brief.budget) {
    reasons.push("Within budget");
  }

  if (matchingConditions.length > 0) {
    reasons.push(
      brief.conditions.includes("All")
        ? "Matches all conditions"
        : `Matches ${matchingConditions.join(", ")}`,
    );
  }

  if (deal.discount > 0) {
    reasons.push(`Best discount in ${deal.category}`);
  }

  return reasons.slice(0, 3);
}

function createBasketFromMatches(
  matches: RecommendationMatch[],
  brief: ShoppingBrief,
  id: number,
): RecommendationBasket {
  const items: RecommendationMatch[] = [];
  let runningTotal = 0;

  for (const match of matches) {
    const nextTotal = runningTotal + match.deal.bestDeal.price;
    if (nextTotal <= brief.budget) {
      items.push(match);
      runningTotal = nextTotal;
    }
  }

  const total = items.reduce((sum, item) => sum + item.deal.bestDeal.price, 0);
  const selectedCategories = new Set(items.map((item) => item.deal.category));
  const missingCategories = brief.categories.filter(
    (category) => !selectedCategories.has(category),
  );

  return {
    id,
    items: items.sort(
      (a, b) =>
        brief.categories.indexOf(a.deal.category) -
          brief.categories.indexOf(b.deal.category) ||
        a.deal.bestDeal.price - b.deal.bestDeal.price,
    ),
    total,
    balance: brief.budget - total,
    missingCategories,
    complete: missingCategories.length === 0,
  };
}

function getBasketKey(basket: RecommendationBasket) {
  return basket.items
    .map((item) => item.deal.id)
    .sort((a, b) => a - b)
    .join("-");
}

export function getRecommendationBaskets(
  deals: EnrichedDeal[],
  brief: ShoppingBrief | null,
): RecommendationBasket[] {
  if (!brief) {
    return [];
  }

  const eligibleMatches = deals
    .filter(
      (deal) =>
        brief.categories.includes(deal.category) &&
        dealMatchesConditions(deal, brief),
    )
    .map((deal) => getDealForBrief(deal, brief))
    .filter((deal): deal is EnrichedDeal => !!deal)
    .filter((deal) => deal.bestDeal.price <= brief.budget)
    .map((deal) => ({
      deal,
      reasons: getRecommendationReasons(deal, brief),
    }))
    .sort(
      (a, b) =>
        a.deal.bestDeal.price - b.deal.bestDeal.price ||
        b.deal.discount - a.deal.discount,
    );

  const basketSorts = [
    eligibleMatches,
    [...eligibleMatches].sort(
      (a, b) =>
        b.deal.discount - a.deal.discount ||
        a.deal.bestDeal.price - b.deal.bestDeal.price,
    ),
    [...eligibleMatches].sort(
      (a, b) =>
        b.deal.bestDeal.price - a.deal.bestDeal.price ||
        b.deal.discount - a.deal.discount,
    ),
    ...brief.categories.map((category) =>
      [...eligibleMatches].sort((a, b) => {
        const aPriority = a.deal.category === category ? 0 : 1;
        const bPriority = b.deal.category === category ? 0 : 1;

        return (
          aPriority - bPriority ||
          a.deal.bestDeal.price - b.deal.bestDeal.price ||
          b.deal.discount - a.deal.discount
        );
      }),
    ),
  ];

  const seen = new Set<string>();
  const baskets = basketSorts
    .map((matches, index) => createBasketFromMatches(matches, brief, index + 1))
    .filter((basket) => basket.items.length > 0)
    .filter((basket) => {
      const key = getBasketKey(basket);
      if (!key || seen.has(key)) return false;

      seen.add(key);
      return true;
    })
    .sort(
      (a, b) =>
        b.items.length - a.items.length ||
        a.balance - b.balance ||
        b.total - a.total,
    )
    .slice(0, 4)
    .map((basket, index) => ({
      ...basket,
      id: index + 1,
    }));

  return baskets;
}

export function getRecommendationBasket(
  deals: EnrichedDeal[],
  brief: ShoppingBrief | null,
): RecommendationBasket | null {
  return getRecommendationBaskets(deals, brief)[0] ?? null;
}

export function getRecommendationSuggestions(
  deals: EnrichedDeal[],
  brief: ShoppingBrief | null,
): EnrichedDeal[] {
  if (!brief) {
    return [];
  }

  return deals
    .map((deal) => getDealForBrief(deal, brief) ?? deal)
    .sort((a, b) => {
      const aCategoryMatch = brief.categories.includes(a.category) ? 0 : 1;
      const bCategoryMatch = brief.categories.includes(b.category) ? 0 : 1;
      const aConditionMatch = dealMatchesConditions(a, brief) ? 0 : 1;
      const bConditionMatch = dealMatchesConditions(b, brief) ? 0 : 1;

      return (
        aCategoryMatch - bCategoryMatch ||
        aConditionMatch - bConditionMatch ||
        a.bestDeal.price - b.bestDeal.price ||
        b.discount - a.discount
      );
    })
    .slice(0, 4);
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
