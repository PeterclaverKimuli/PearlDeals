import { requireAdmin, type AdminApiRequest } from "./_utils.js";
import { sendJson } from "../_utils.js";

export default function handler(
  req: AdminApiRequest,
  res: Parameters<typeof sendJson>[0],
) {
  if (!requireAdmin(req, res)) return;

  sendJson(res, 200, {
    status: "ok",
    service: "pearldeals-admin-api",
    timestamp: new Date().toISOString(),
  });
}
