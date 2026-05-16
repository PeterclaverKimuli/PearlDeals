import { getHomepagePayload, loadApiDeals, sendJson } from "./_utils.js";

type HomeRequest = {
  query: {
    q?: string;
    category?: string;
    behavioralCategory?: string;
    viewAll?: string;
    includeDeals?: string;
    page?: string;
    pageSize?: string;
  };
};

export default async function handler(
  req: HomeRequest,
  res: Parameters<typeof sendJson>[0],
) {
  const deals = await loadApiDeals();

  sendJson(
    res,
    200,
    getHomepagePayload({
      deals,
      query: req.query.q ?? "",
      selectedCategory: req.query.category ?? null,
      selectedBehavioralCategory: req.query.behavioralCategory ?? null,
      isViewingAllProducts: req.query.viewAll === "true",
      includeDeals: req.query.includeDeals === "true",
      page: req.query.page,
      pageSize: req.query.pageSize,
    }),
  );
}
