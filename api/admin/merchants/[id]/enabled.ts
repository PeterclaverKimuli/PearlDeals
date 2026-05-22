import { setMerchantEnabled } from "../../../../server/adminMutations.js";
import {
  getBodyRecord,
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
    requireConfirmation(req.body, "set-merchant-enabled");
    const body = getBodyRecord(req.body);

    if (typeof body.enabled !== "boolean") {
      throw new Error("A boolean enabled value is required.");
    }

    return {
      merchant: await setMerchantEnabled({
        merchantId: getRequestNumberParam(req, "id"),
        enabled: body.enabled,
        actor: "admin",
      }),
    };
  });
}
