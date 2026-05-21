import "./env.js";
import { timingSafeEqual } from "node:crypto";

export const adminSessionCookieName = "pearldeals_admin";
export const defaultAdminRouteSegment = "23234";

type HeaderValue = string | string[] | undefined;

export type AdminRequestLike = {
  headers?: {
    cookie?: HeaderValue;
  };
};

function getAdminToken() {
  return process.env.ADMIN_TOKEN ?? "";
}

function isProduction() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) return false;

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getCookieHeader(req: AdminRequestLike) {
  const cookie = req.headers?.cookie;
  return Array.isArray(cookie) ? cookie.join("; ") : cookie ?? "";
}

export function getAdminRouteSegment() {
  return process.env.ADMIN_ROUTE_SEGMENT ?? defaultAdminRouteSegment;
}

export function parseCookie(req: AdminRequestLike, name: string) {
  const cookies = getCookieHeader(req);
  if (!cookies) return null;

  const prefix = `${name}=`;
  const cookie = cookies
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  if (!cookie) return null;

  return decodeURIComponent(cookie.slice(prefix.length));
}

export function isAdminTokenValid(candidate: string | null | undefined) {
  const token = getAdminToken();
  if (!token || !candidate) return false;

  return safeEqual(candidate, token);
}

export function isAdminAuthenticated(req: AdminRequestLike) {
  return isAdminTokenValid(parseCookie(req, adminSessionCookieName));
}

export function createAdminSessionCookie(token: string) {
  const secure = isProduction() ? "; Secure" : "";

  return [
    `${adminSessionCookieName}=${encodeURIComponent(token)}`,
    "Path=/api/admin",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=28800",
    secure,
  ].join("; ");
}

export function clearAdminSessionCookie() {
  const secure = isProduction() ? "; Secure" : "";

  return [
    `${adminSessionCookieName}=`,
    "Path=/api/admin",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=0",
    secure,
  ].join("; ");
}
