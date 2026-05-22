import {
  getAdminMerchants,
  getAdminOffers,
  getAdminProducts,
  getAdminScrapeRuns,
  getAdminSummary,
} from "../../server/adminData.js";
import {
  createAdminProduct,
  setMerchantEnabled,
  setOfferHidden,
  setProductHidden,
} from "../../server/adminMutations.js";
import {
  clearAdminSessionCookie,
  createAdminSessionCookie,
  getAdminRouteSegment,
  isAdminAuthenticated,
  isAdminTokenValid,
  type AdminRequestLike,
} from "../../server/adminAuth.js";
import { probeScrapeUrl } from "../../server/scrapeProbe.js";
import { sendJson } from "../_utils.js";
import type { AdminCreateProductInput } from "../../shared/admin/types.js";

type AdminCatchAllRequest = AdminRequestLike & {
  method?: string;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
  url?: string;
};

type AdminResponse = Parameters<typeof sendJson>[0];

function getBodyRecord(body: unknown) {
  return body && typeof body === "object"
    ? (body as Record<string, unknown>)
    : {};
}

function getTokenFromBody(body: unknown) {
  const token = getBodyRecord(body).token;
  return typeof token === "string" ? token : null;
}

function getRouteSegments(req: AdminCatchAllRequest) {
  const route = req.query?.route;

  if (Array.isArray(route)) return route.map(String);
  if (typeof route === "string") return [route];

  const pathname = req.url ? new URL(req.url, "http://localhost").pathname : "";
  return pathname
    .replace(/^\/api\/admin\/?/, "")
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);
}

function parseId(value: string | undefined, label: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`Invalid ${label}.`);
  }

  return id;
}

function requireConfirmation(body: unknown, expected: string) {
  if (getBodyRecord(body).confirm !== expected) {
    throw new Error(`Confirmation "${expected}" is required.`);
  }
}

function requireAdmin(req: AdminCatchAllRequest, res: AdminResponse) {
  if (isAdminAuthenticated(req)) return true;

  sendJson(res, 401, { error: "Admin authentication required" });
  return false;
}

function getCreateProductInput(body: unknown): AdminCreateProductInput {
  const record = getBodyRecord(body);
  requireConfirmation(body, "create-product");

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

async function sendRead(
  req: AdminCatchAllRequest,
  res: AdminResponse,
  loadPayload: () => Promise<unknown>,
) {
  if (req.method !== "GET") {
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

async function sendMutation(
  req: AdminCatchAllRequest,
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

function handleSession(req: AdminCatchAllRequest, res: AdminResponse) {
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

export default async function handler(
  req: AdminCatchAllRequest,
  res: AdminResponse,
) {
  const [resource, id, action] = getRouteSegments(req);

  if (resource === "session") {
    handleSession(req, res);
    return;
  }

  if (resource === "health") {
    await sendRead(req, res, async () => ({
      status: "ok",
      service: "pearldeals-admin-api",
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  if (resource === "summary") {
    await sendRead(req, res, getAdminSummary);
    return;
  }

  if (resource === "products" && !id) {
    if (req.method === "POST") {
      await sendMutation(req, res, async () => ({
        created: await createAdminProduct({
          input: getCreateProductInput(req.body),
          actor: "admin",
        }),
      }));
      return;
    }

    await sendRead(req, res, async () => ({
      products: await getAdminProducts(),
    }));
    return;
  }

  if (resource === "products" && action === "hide") {
    await sendMutation(req, res, async () => {
      requireConfirmation(req.body, "hide-product");
      return {
        product: await setProductHidden({
          productId: parseId(id, "product id"),
          hidden: true,
          actor: "admin",
        }),
      };
    });
    return;
  }

  if (resource === "products" && action === "unhide") {
    await sendMutation(req, res, async () => {
      requireConfirmation(req.body, "unhide-product");
      return {
        product: await setProductHidden({
          productId: parseId(id, "product id"),
          hidden: false,
          actor: "admin",
        }),
      };
    });
    return;
  }

  if (resource === "offers" && !id) {
    await sendRead(req, res, async () => ({
      offers: await getAdminOffers(),
    }));
    return;
  }

  if (resource === "offers" && action === "hide") {
    await sendMutation(req, res, async () => {
      requireConfirmation(req.body, "hide-offer");
      return {
        offer: await setOfferHidden({
          offerId: parseId(id, "offer id"),
          hidden: true,
          actor: "admin",
        }),
      };
    });
    return;
  }

  if (resource === "offers" && action === "unhide") {
    await sendMutation(req, res, async () => {
      requireConfirmation(req.body, "unhide-offer");
      return {
        offer: await setOfferHidden({
          offerId: parseId(id, "offer id"),
          hidden: false,
          actor: "admin",
        }),
      };
    });
    return;
  }

  if (resource === "merchants" && !id) {
    await sendRead(req, res, async () => ({
      merchants: await getAdminMerchants(),
    }));
    return;
  }

  if (resource === "merchants" && action === "enabled") {
    await sendMutation(req, res, async () => {
      requireConfirmation(req.body, "set-merchant-enabled");
      const body = getBodyRecord(req.body);
      if (typeof body.enabled !== "boolean") {
        throw new Error("A boolean enabled value is required.");
      }

      return {
        merchant: await setMerchantEnabled({
          merchantId: parseId(id, "merchant id"),
          enabled: body.enabled,
          actor: "admin",
        }),
      };
    });
    return;
  }

  if (resource === "scrape-runs") {
    await sendRead(req, res, async () => ({
      scrapeRuns: await getAdminScrapeRuns(),
    }));
    return;
  }

  if (resource === "scrape-probe") {
    await sendMutation(req, res, async () => {
      const body = getBodyRecord(req.body);
      if (typeof body.url !== "string" || !body.url.trim()) {
        throw new Error("A URL is required.");
      }

      return {
        probe: await probeScrapeUrl(body.url.trim()),
      };
    });
    return;
  }

  sendJson(res, 404, { error: "Admin route not found" });
}
