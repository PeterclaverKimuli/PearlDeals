import {
  getRecommendationsPayload,
  loadApiDeals,
  sendJson,
  shoppingBriefSchema,
} from "./_utils.js";

type RecommendationsRequest = {
  method?: string;
  query?: {
    q?: string;
    page?: string;
    pageSize?: string;
  };
  body: unknown;
};

export default async function handler(
  req: RecommendationsRequest,
  res: Parameters<typeof sendJson>[0],
) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const parsedBrief = shoppingBriefSchema.safeParse(req.body);
  if (!parsedBrief.success) {
    sendJson(res, 400, {
      error: "Invalid shopping brief",
      issues: parsedBrief.error.flatten(),
    });
    return;
  }

  const deals = await loadApiDeals();

  sendJson(
    res,
    200,
    getRecommendationsPayload(deals, parsedBrief.data, {
      query: req.query?.q,
      page: req.query?.page,
      pageSize: req.query?.pageSize,
    }),
  );
}
