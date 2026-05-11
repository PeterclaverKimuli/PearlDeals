import { loadApiDeals, sendJson } from "../_utils.js";

type DealRequest = {
  query: {
    id?: string;
  };
};

export default async function handler(
  req: DealRequest,
  res: Parameters<typeof sendJson>[0],
) {
  const id = Number(req.query.id);
  const deals = await loadApiDeals();
  const deal = deals.find((item) => item.id === id);

  if (!deal) {
    sendJson(res, 404, { error: "Deal not found" });
    return;
  }

  sendJson(res, 200, { deal });
}
