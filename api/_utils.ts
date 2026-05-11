import { z } from "zod";
import {
  getCategoriesPayload,
  getHomepagePayload,
  getRecommendationsPayload,
  getSearchPayload,
  loadDeals,
} from "../server/catalog.js";

export const shoppingBriefSchema = z.object({
  budget: z.number().nonnegative(),
  categories: z.array(z.string()),
  conditions: z.array(z.enum(["New", "Refurbished", "Used", "All"])),
});

type JsonResponse = {
  status: (code: number) => JsonResponse;
  json: (body: unknown) => void;
  setHeader?: (name: string, value: string) => void;
};

export function sendJson(res: JsonResponse, statusCode: number, body: unknown) {
  res.status(statusCode).json(body);
}

export async function loadApiDeals() {
  return loadDeals({
    warn: (payload, message) => {
      console.warn(message ?? "API warning", payload);
    },
  });
}

export {
  getCategoriesPayload,
  getHomepagePayload,
  getRecommendationsPayload,
  getSearchPayload,
};
