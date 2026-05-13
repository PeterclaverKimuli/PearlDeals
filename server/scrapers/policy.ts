export type MerchantScrapePolicy = {
  merchantSlug: string;
  reviewedAt: string;
  allowed: boolean;
  maxRequestsPerMinute: number;
  userAgent: string;
  notes: string;
};

export const merchantScrapePolicies: Record<string, MerchantScrapePolicy> = {
  jiji: {
    merchantSlug: "jiji",
    reviewedAt: "2026-05-13",
    allowed: true,
    maxRequestsPerMinute: 10,
    userAgent:
      "PearlDealsBot/0.1 (+https://pearldeals.local; contact: pearldeals-dev)",
    notes:
      "Jiji Uganda robots.txt only disallows test, admin, CRM, and Facebook auth paths. Product listing pages are not disallowed, but Cloudflare challenges may safely fail scripted fetches.",
  },
  jumia: {
    merchantSlug: "jumia",
    reviewedAt: "2026-05-12",
    allowed: true,
    maxRequestsPerMinute: 30,
    userAgent:
      "PearlDealsBot/0.1 (+https://pearldeals.local; contact: pearldeals-dev)",
    notes:
      "Jumia Uganda robots.txt allows clearly identified bots below 200 requests per minute. Phase 4E pilot uses a lower 30 RPM cap.",
  },
  kanta: {
    merchantSlug: "kanta",
    reviewedAt: "2026-05-13",
    allowed: true,
    maxRequestsPerMinute: 10,
    userAgent:
      "PearlDealsBot/0.1 (+https://pearldeals.local; contact: pearldeals-dev)",
    notes:
      "Kanta product pages expose index/follow product metadata and schema.org product offers. Phase 4G uses a conservative 10 RPM cap.",
  },
  tilyexpress: {
    merchantSlug: "tilyexpress",
    reviewedAt: "2026-05-13",
    allowed: true,
    maxRequestsPerMinute: 10,
    userAgent:
      "PearlDealsBot/0.1 (+https://pearldeals.local; contact: pearldeals-dev)",
    notes:
      "Tilyexpress product pages expose index/follow product metadata and product price, availability, and condition meta tags. Phase 4G replacement pilot uses a conservative 10 RPM cap.",
  },
};

export function getMerchantScrapePolicy(merchantSlug: string) {
  return merchantScrapePolicies[merchantSlug] ?? null;
}

export function assertMerchantScrapingAllowed(merchantSlug: string) {
  const policy = getMerchantScrapePolicy(merchantSlug);

  if (!policy?.allowed) {
    throw new Error(
      `Scraping is not enabled for ${merchantSlug}; review merchant policy first.`,
    );
  }

  return policy;
}
