export function createMerchantSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function inferMerchantBaseUrl(site: string, offerUrl?: string | null) {
  if (offerUrl) {
    try {
      const url = new URL(offerUrl);
      return `${url.protocol}//${url.hostname}`;
    } catch {
      // Fall back to known merchant hosts below.
    }
  }

  const slug = createMerchantSlug(site);
  const knownBaseUrls: Record<string, string> = {
    abanista: "https://www.abanista.com",
    dombelo: "https://www.dombelo.com",
    duuka: "https://www.duuka.ug",
    ellydeals: "https://ellydealsug.com",
    "gadget-craze": "https://www.gadgetcraze.ug",
    goodprice: "https://goodprice.ug",
    jiji: "https://jiji.ug",
    jumia: "https://www.jumia.ug",
    kanta: "https://kanta.ug",
    kibuga: "https://kibuga.com",
    kwesi: "https://kwesistores.com",
    "mobile-shop": "https://mobileshop.ug",
    nabstores: "https://nabstores.com",
    "real-systems": "https://realsystemsug.com",
    sefbuy: "https://sefbuy.com",
    techxpress: "https://techxpressug.com",
    tilyexpress: "https://www.tilyexpress.ug",
  };

  return knownBaseUrls[slug] ?? null;
}
