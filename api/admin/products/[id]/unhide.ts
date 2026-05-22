import { setProductHidden } from "../../../../server/adminMutations.js";
import {
  getRequestNumberParam,
  handleAdminPost,
  requireConfirmation,
  type AdminApiRequest,
} from "../../_utils.js";
import { sendJson } from "../../../_utils.js";

export default async function handler(
  req: AdminApiRequest,
  res: Parameters<typeof sendJson>[0],
) {
  await handleAdminPost(req, res, async () => {
    requireConfirmation(req.body, "unhide-product");
    return {
      product: await setProductHidden({
        productId: getRequestNumberParam(req, "id"),
        hidden: false,
        actor: "admin",
      }),
    };
  });
}
