import { sendJson } from "./_utils";

export default function handler(_req: unknown, res: Parameters<typeof sendJson>[0]) {
  sendJson(res, 200, {
    status: "ok",
    service: "pearldeals-api",
    timestamp: new Date().toISOString(),
  });
}
