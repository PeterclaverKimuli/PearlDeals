import { getPrisma } from "./db.js";

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
  return getPrisma().adminAuditLog.create({
    data: {
      action,
      targetType,
      targetId,
      actor,
      before: before ?? undefined,
      after: after ?? undefined,
    },
  });
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
