import { getCategoriesPayload, loadApiDeals, sendJson } from "./_utils";

export default async function handler(
  _req: unknown,
  res: Parameters<typeof sendJson>[0],
) {
  const deals = await loadApiDeals();

  sendJson(res, 200, getCategoriesPayload(deals));
}
