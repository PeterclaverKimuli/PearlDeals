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
  query?: Record<string, string | string[] | undefined>;
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

export async function handleAdminGet(
  req: AdminApiRequest,
  res: AdminResponse,
  loadPayload: () => Promise<unknown>,
) {
  if (req.method && req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (!requireAdmin(req, res)) return;

  try {
    sendJson(res, 200, await loadPayload());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin request failed";
    sendJson(res, 500, { error: message });
  }
}

export function getRequestNumberParam(req: AdminApiRequest, name: string) {
  const value = req.query?.[name];
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name}.`);
  }

  return parsed;
}

export function getBodyRecord(body: unknown) {
  return body && typeof body === "object"
    ? (body as Record<string, unknown>)
    : {};
}

export function requireConfirmation(body: unknown, expected: string) {
  const record = getBodyRecord(body);

  if (record.confirm !== expected) {
    throw new Error(`Confirmation "${expected}" is required.`);
  }
}

export async function handleAdminPost(
  req: AdminApiRequest,
  res: AdminResponse,
  mutate: () => Promise<unknown>,
) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (!requireAdmin(req, res)) return;

  try {
    sendJson(res, 200, await mutate());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Admin mutation failed";
    sendJson(res, 400, { error: message });
  }
}
