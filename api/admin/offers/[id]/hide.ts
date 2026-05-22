import { setOfferHidden } from "../../../../server/adminMutations.js";
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
    requireConfirmation(req.body, "hide-offer");
    return {
      offer: await setOfferHidden({
        offerId: getRequestNumberParam(req, "id"),
        hidden: true,
        actor: "admin",
      }),
    };
  });
}
