export type Availability = "in_stock" | "out_of_stock" | "unknown";

export type ScrapeCondition = "New" | "Used" | "Refurbished";

export type ScrapeResult = {
  title: string;
  price: number;
  original?: number;
  image?: string;
  availability: Availability;
  condition?: ScrapeCondition;
  canonicalUrl?: string;
};

export type MerchantAdapter = {
  merchantSlug: string;
  scrapeOffer(url: string): Promise<ScrapeResult>;
};

export type ScrapeValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};
