export type AdminVisibility = "visible" | "hidden" | "not_listed";

export type AdminSummary = {
  products: {
    total: number;
    visible: number;
    hidden: number;
    notListed: number;
  };
  offers: {
    total: number;
    visible: number;
    failed: number;
    pending: number;
  };
  merchants: {
    total: number;
    enabled: number;
    disabled: number;
  };
  scrapeRuns: {
    total: number;
    latestStatus: string | null;
  };
};

export type AdminProductRow = {
  id: number;
  title: string;
  category: string;
  image: string;
  visibility: AdminVisibility;
  offerCount: number;
  visibleOfferCount: number;
  failedOfferCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminOfferRow = {
  id: number;
  productId: number;
  productTitle: string;
  merchantId: number | null;
  merchantName: string | null;
  site: string;
  price: number;
  original: number;
  url: string | null;
  status: string | null;
  availability: string;
  scrapeStatus: string;
  failureCount: number;
  lastScrapedAt: string | null;
  lastSuccessfulScrapeAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminMerchantRow = {
  id: number;
  name: string;
  slug: string;
  baseUrl: string | null;
  enabled: boolean;
  scrapeStrategy: string | null;
  offerCount: number;
  failedOfferCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminScrapeRunRow = {
  id: number;
  status: string;
  startedAt: string;
  completedAt: string | null;
  totalJobs: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminAuditEntry = {
  id: number;
  action: string;
  targetType: string;
  targetId: string | null;
  actor: string | null;
  before: unknown;
  after: unknown;
  createdAt: string;
};
