import { handleAdminSession, type AdminApiRequest } from "./_utils.js";
import { sendJson } from "../_utils.js";

export default function handler(
  req: AdminApiRequest,
  res: Parameters<typeof sendJson>[0],
) {
  handleAdminSession(req, res);
}
