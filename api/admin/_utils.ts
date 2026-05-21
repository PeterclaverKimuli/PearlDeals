import {
  clearAdminSessionCookie,
  createAdminSessionCookie,
  getAdminRouteSegment,
  isAdminAuthenticated,
  isAdminTokenValid,
  type AdminRequestLike,
} from "../../server/adminAuth.js";
import { sendJson } from "../_utils.js";

type AdminResponse = Parameters<typeof sendJson>[0];

export type AdminApiRequest = AdminRequestLike & {
  method?: string;
  body?: unknown;
};

function getTokenFromBody(body: unknown) {
  if (!body || typeof body !== "object") return null;

  const token = (body as { token?: unknown }).token;
  return typeof token === "string" ? token : null;
}

export function requireAdmin(req: AdminApiRequest, res: AdminResponse) {
  if (isAdminAuthenticated(req)) return true;

  sendJson(res, 401, { error: "Admin authentication required" });
  return false;
}

export function handleAdminSession(req: AdminApiRequest, res: AdminResponse) {
  if (req.method === "GET") {
    sendJson(res, 200, {
      authenticated: isAdminAuthenticated(req),
      adminPath: `/${getAdminRouteSegment()}/admin`,
    });
    return;
  }

  if (req.method === "POST") {
    const token = getTokenFromBody(req.body);
    if (!token || !isAdminTokenValid(token)) {
      sendJson(res, 401, { error: "Invalid admin token" });
      return;
    }

    res.setHeader?.("Set-Cookie", createAdminSessionCookie(token));
    sendJson(res, 200, {
      authenticated: true,
      adminPath: `/${getAdminRouteSegment()}/admin`,
    });
    return;
  }

  if (req.method === "DELETE") {
    res.setHeader?.("Set-Cookie", clearAdminSessionCookie());
    sendJson(res, 200, { authenticated: false });
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
}
