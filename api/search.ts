import { getSearchPayload, loadApiDeals, sendJson } from "./_utils.js";

type SearchRequest = {
  query: {
    q?: string;
    page?: string;
    pageSize?: string;
  };
};

export default async function handler(
  req: SearchRequest,
  res: Parameters<typeof sendJson>[0],
) {
  const deals = await loadApiDeals();

  sendJson(
    res,
    200,
    getSearchPayload(deals, req.query.q ?? "", {
      page: req.query.page,
      pageSize: req.query.pageSize,
    }),
  );
}
