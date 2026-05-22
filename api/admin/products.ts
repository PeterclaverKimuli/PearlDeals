import { getAdminProducts } from "../../server/adminData.js";
import { createAdminProduct } from "../../server/adminMutations.js";
import {
  getBodyRecord,
  handleAdminGet,
  handleAdminPost,
  type AdminApiRequest,
} from "./_utils.js";
import { sendJson } from "../_utils.js";
import type { AdminCreateProductInput } from "../../shared/admin/types.js";

function getCreateProductInput(body: unknown): AdminCreateProductInput {
  const record = getBodyRecord(body);

  if (record.confirm !== "create-product") {
    throw new Error('Confirmation "create-product" is required.');
  }

  const offers = Array.isArray(record.offers) ? record.offers : [];
  if (offers.length < 3) {
    throw new Error("At least 3 offers are required.");
  }

  return {
    title: String(record.title ?? ""),
    category: String(record.category ?? ""),
    image: String(record.image ?? ""),
    offers: offers as AdminCreateProductInput["offers"],
  };
}

export default async function handler(
  req: AdminApiRequest,
  res: Parameters<typeof sendJson>[0],
) {
  if (req.method === "POST") {
    await handleAdminPost(req, res, async () => ({
      created: await createAdminProduct({
        input: getCreateProductInput(req.body),
        actor: "admin",
      }),
    }));
    return;
  }

  await handleAdminGet(req, res, async () => ({
    products: await getAdminProducts(),
  }));
}
