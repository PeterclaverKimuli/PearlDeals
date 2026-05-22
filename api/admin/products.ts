import { getAdminProducts } from "../../server/adminData.js";
import { handleAdminGet, type AdminApiRequest } from "./_utils.js";
import { sendJson } from "../_utils.js";

export default async function handler(
  req: AdminApiRequest,
  res: Parameters<typeof sendJson>[0],
) {
  await handleAdminGet(req, res, async () => ({
    products: await getAdminProducts(),
  }));
}
