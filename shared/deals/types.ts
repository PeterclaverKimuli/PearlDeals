export type PriceEntry = {
  site: string;
  price: number;
  original: number;
  url?: string;
  status?: string;
};

export type RawDeal = {
  id: number;
  title: string;
  image?: string;
  category?: string;
  prices?: PriceEntry[];
};

export type Deal = {
  id: number;
  title: string;
  image: string;
  prices: PriceEntry[];
  category: string;
};

export type EnrichedDeal = Deal & {
  bestDeal: PriceEntry;
  discount: number;
};

export type ConditionChoice = "New" | "Refurbished" | "Used" | "All";

export type ShoppingBrief = {
  budget: number;
  categories: string[];
  conditions: ConditionChoice[];
};

export type RecommendationMatch = {
  deal: EnrichedDeal;
  reasons: string[];
};

export type RecommendationBasket = {
  id: number;
  items: RecommendationMatch[];
  total: number;
  balance: number;
  missingCategories: string[];
  complete: boolean;
};

export type RecommendationsPayload = {
  baskets: RecommendationBasket[];
  suggestions: EnrichedDeal[];
  matchingDeals: EnrichedDeal[];
};

export type CategoryItem = {
  name: string;
  icon: string;
  description?: string;
  kind?: "product" | "behavioral";
  productIds?: number[];
};

export type SelfCheck = {
  name: string;
  pass: boolean;
};
