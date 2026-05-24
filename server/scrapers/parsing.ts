export function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#x22;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&apos;/g, "'")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .replace(/&[a-z]+;/gi, " ");
}

export function normalizeDecodedText(value: string) {
  return decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
}

export function stripHtml(value: string) {
  return normalizeDecodedText(value.replace(/<[^>]*>/g, " "));
}

export function getMetaContent(html: string, property: string) {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${escapedProperty}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escapedProperty}["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+name=["']${escapedProperty}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1]).trim();
  }

  return null;
}

export function getCanonicalUrl(html: string, fallbackUrl: string) {
  const match = html.match(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i,
  );

  return match?.[1] ? decodeHtmlEntities(match[1]).trim() : fallbackUrl;
}

export function parseUgxPrice(value: string) {
  const match = value.match(/(?:UGX|USh)\s*([\d,]+)/i);
  if (!match?.[1]) return null;

  const price = Number(match[1].replace(/,/g, ""));
  return Number.isInteger(price) && price > 0 ? price : null;
}

export function getUgxPrices(value: string) {
  return Array.from(value.matchAll(/(?:UGX|USh)\s*([\d,]+)/gi))
    .map((match) => Number(match[1]?.replace(/,/g, "")))
    .filter((price) => Number.isInteger(price) && price > 0);
}
