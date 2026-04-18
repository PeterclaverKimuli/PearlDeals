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

export type CategoryItem = {
  name: string;
  icon: string;
};

export type SelfCheck = {
  name: string;
  pass: boolean;
};
