import { getPrisma } from "./db.js";
import { Prisma } from "@prisma/client";
import type { AdminCreateProductInput } from "../shared/admin/types.js";

type AdminActor = string | null;

function getTargetId(id: number) {
  return String(id);
}

async function writeAuditLog({
  action,
  targetType,
  targetId,
  actor,
  before,
  after,
}: {
  action: string;
  targetType: string;
  targetId: string;
  actor: AdminActor;
  before: unknown;
  after: unknown;
}) {
  const beforeJson = toAuditJson(before);
  const afterJson = toAuditJson(after);

  return getPrisma().adminAuditLog.create({
    data: {
      action,
      targetType,
      targetId,
      actor,
      before: beforeJson,
      after: afterJson,
    },
  });
}

function toAuditJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function productSelect() {
  return {
    id: true,
    title: true,
    category: true,
    hidden: true,
    updatedAt: true,
  } as const;
}

function offerSelect() {
  return {
    id: true,
    productId: true,
    site: true,
    merchantId: true,
    scrapeStatus: true,
    failureCount: true,
    lastScrapedAt: true,
    updatedAt: true,
  } as const;
}

function merchantSelect() {
  return {
    id: true,
    name: true,
    slug: true,
    enabled: true,
    scrapeStrategy: true,
    updatedAt: true,
  } as const;
}

function createMerchantSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferMerchantBaseUrl(offerUrl: string) {
  try {
    const url = new URL(offerUrl);
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return null;
  }
}

function normalizeRequiredText(value: string, field: string) {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);

  return normalized;
}

function normalizePositiveInteger(value: number, field: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer.`);
  }

  return value;
}

async function getNextAdminProductId() {
  const product = await getPrisma().product.findFirst({
    where: {
      id: {
        gte: 20_000,
      },
    },
    orderBy: {
      id: "desc",
    },
    select: {
      id: true,
    },
  });

  return product ? product.id + 1 : 20_000;
}

export async function setProductHidden({
  productId,
  hidden,
  actor,
}: {
  productId: number;
  hidden: boolean;
  actor: AdminActor;
}) {
  const prisma = getPrisma();
  const before = await prisma.product.findUnique({
    where: { id: productId },
    select: productSelect(),
  });

  if (!before) throw new Error(`Product ${productId} was not found.`);

  const after = await prisma.product.update({
    where: { id: productId },
    data: { hidden },
    select: productSelect(),
  });

  await writeAuditLog({
    action: hidden ? "hide_product" : "unhide_product",
    targetType: "product",
    targetId: getTargetId(productId),
    actor,
    before,
    after,
  });

  return after;
}

export async function setOfferHidden({
  offerId,
  hidden,
  actor,
}: {
  offerId: number;
  hidden: boolean;
  actor: AdminActor;
}) {
  const prisma = getPrisma();
  const before = await prisma.offer.findUnique({
    where: { id: offerId },
    select: offerSelect(),
  });

  if (!before) throw new Error(`Offer ${offerId} was not found.`);

  const after = await prisma.offer.update({
    where: { id: offerId },
    data: hidden
      ? {
          scrapeStatus: "failed",
          failureCount: { increment: 1 },
          lastScrapedAt: new Date(),
        }
      : {
          scrapeStatus: "pending",
          failureCount: 0,
        },
    select: offerSelect(),
  });

  await writeAuditLog({
    action: hidden ? "hide_offer" : "unhide_offer",
    targetType: "offer",
    targetId: getTargetId(offerId),
    actor,
    before,
    after,
  });

  return after;
}

export async function setMerchantEnabled({
  merchantId,
  enabled,
  actor,
}: {
  merchantId: number;
  enabled: boolean;
  actor: AdminActor;
}) {
  const prisma = getPrisma();
  const before = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: merchantSelect(),
  });

  if (!before) throw new Error(`Merchant ${merchantId} was not found.`);

  const after = await prisma.merchant.update({
    where: { id: merchantId },
    data: { enabled },
    select: merchantSelect(),
  });

  await writeAuditLog({
    action: enabled ? "enable_merchant" : "disable_merchant",
    targetType: "merchant",
    targetId: getTargetId(merchantId),
    actor,
    before,
    after,
  });

  return after;
}

export async function createAdminProduct({
  input,
  actor,
}: {
  input: AdminCreateProductInput;
  actor: AdminActor;
}) {
  if (input.offers.length < 3) {
    throw new Error("At least 3 offers are required.");
  }

  const title = normalizeRequiredText(input.title, "Product title");
  const category = normalizeRequiredText(input.category, "Product category");
  const image = normalizeRequiredText(input.image, "Product image");
  const offers = input.offers.map((offer, index) => {
    const row = index + 1;
    const url = normalizeRequiredText(offer.url, `Offer ${row} URL`);
    const merchantName = normalizeRequiredText(
      offer.merchantName,
      `Offer ${row} merchant`,
    );
    const price = normalizePositiveInteger(offer.price, `Offer ${row} price`);
    const original = normalizePositiveInteger(
      offer.original || offer.price,
      `Offer ${row} original price`,
    );

    return {
      merchantName,
      price,
      original,
      url,
      status: offer.status.trim() || "New",
      availability: offer.availability.trim() || "unknown",
    };
  });

  const prisma = getPrisma();
  const productId = await getNextAdminProductId();
  const created = await prisma.$transaction(async (transaction) => {
    const product = await transaction.product.create({
      data: {
        id: productId,
        title,
        category,
        image,
      },
      select: {
        id: true,
        title: true,
        category: true,
        image: true,
        hidden: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const createdOffers = [];
    for (const offer of offers) {
      const slug = createMerchantSlug(offer.merchantName);
      const merchant = await transaction.merchant.upsert({
        where: { slug },
        update: {
          name: offer.merchantName,
          baseUrl: inferMerchantBaseUrl(offer.url),
        },
        create: {
          name: offer.merchantName,
          slug,
          baseUrl: inferMerchantBaseUrl(offer.url),
          enabled: false,
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });

      createdOffers.push(
        await transaction.offer.create({
          data: {
            productId: product.id,
            merchantId: merchant.id,
            site: offer.merchantName,
            price: offer.price,
            original: offer.original,
            url: offer.url,
            status: offer.status,
            availability: offer.availability,
            scrapeStatus: "pending",
            canonicalUrl: offer.url,
          },
          select: {
            id: true,
            productId: true,
            merchantId: true,
            site: true,
            price: true,
            original: true,
            url: true,
            status: true,
            availability: true,
            scrapeStatus: true,
          },
        }),
      );
    }

    await transaction.adminAuditLog.create({
      data: {
        action: "create_product",
        targetType: "product",
        targetId: getTargetId(product.id),
        actor,
        before: Prisma.JsonNull,
        after: toAuditJson({ product, offers: createdOffers }),
      },
    });

    return {
      product,
      offers: createdOffers,
    };
  });

  return created;
}
