import { probeScrapeUrl } from "../../server/scrapeProbe.js";
import {
  getBodyRecord,
  handleAdminPost,
  type AdminApiRequest,
} from "./_utils.js";
import { sendJson } from "../_utils.js";

export default async function handler(
  req: AdminApiRequest,
  res: Parameters<typeof sendJson>[0],
) {
  await handleAdminPost(req, res, async () => {
    const body = getBodyRecord(req.body);
    if (typeof body.url !== "string" || !body.url.trim()) {
      throw new Error("A URL is required.");
    }

    return {
      probe: await probeScrapeUrl(body.url.trim()),
    };
  });
}
