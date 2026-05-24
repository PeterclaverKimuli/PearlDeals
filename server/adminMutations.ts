import { getPrisma } from "./db.js";
import { Prisma } from "@prisma/client";
import type {
  AdminCreateProductInput,
  AdminSimilarProduct,
  AdminUpdateProductInput,
} from "../shared/admin/types.js";
import { normalizeDecodedText } from "./scrapers/parsing.js";

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
  const normalized = normalizeDecodedText(value);
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

function getTitleTokens(value: string) {
  return new Set(
    Array.from(
      normalizeDecodedText(value)
        .toLowerCase()
        .matchAll(/[a-z]+\d+[a-z]*|\d+(?:\.\d+)?[a-z]*|[a-z]+/g),
      (match) => match[0],
    ).filter((token) => token.length >= 2 || /^\d+(?:\.\d+)?$/.test(token)),
  );
}

function getSpecTokenFamilies(tokens: Set<string>) {
  const families = {
    screen: new Set<string>(),
    memory: new Set<string>(),
    camera: new Set<string>(),
    battery: new Set<string>(),
    network: new Set<string>(),
  };

  for (const token of tokens) {
    if (/^\d+\.\d+$/.test(token)) families.screen.add(token);
    if (/^\d+(?:gb|tb|mb)$/.test(token)) families.memory.add(token);
    if (/^\d+mp$/.test(token)) families.camera.add(token);
    if (/^\d+mah$/.test(token)) families.battery.add(token);
    if (/^\d+g$/.test(token)) families.network.add(token);
  }

  return families;
}

function hasMeaningfulSpecConflict(leftTokens: Set<string>, rightTokens: Set<string>) {
  const leftFamilies = getSpecTokenFamilies(leftTokens);
  const rightFamilies = getSpecTokenFamilies(rightTokens);
  const familyNames = Object.keys(leftFamilies) as Array<keyof typeof leftFamilies>;

  return familyNames.some((familyName) => {
    const leftValues = leftFamilies[familyName];
    const rightValues = rightFamilies[familyName];
    if (leftValues.size === 0 || rightValues.size === 0) return false;

    for (const value of leftValues) {
      if (!rightValues.has(value)) return true;
    }

    for (const value of rightValues) {
      if (!leftValues.has(value)) return true;
    }

    return false;
  });
}

function getSimilarityScore(left: string, right: string) {
  const leftTokens = getTitleTokens(left);
  const rightTokens = getTitleTokens(right);
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

  let sharedCount = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) sharedCount += 1;
  }

  const containmentScore = sharedCount / Math.min(leftTokens.size, rightTokens.size);
  const unionSize = new Set([...leftTokens, ...rightTokens]).size;
  const jaccardScore = sharedCount / unionSize;
  const score = containmentScore * 0.65 + jaccardScore * 0.35;

  return hasMeaningfulSpecConflict(leftTokens, rightTokens)
    ? Math.min(score, 0.78)
    : score;
}

export async function findSimilarProducts({
  title,
  category,
  excludeProductId,
  minimumScore = 0.62,
}: {
  title: string;
  category?: string;
  excludeProductId?: number;
  minimumScore?: number;
}): Promise<AdminSimilarProduct[]> {
  const decodedTitle = normalizeDecodedText(title);
  const normalizedCategory = normalizeDecodedText(category ?? "");
  if (decodedTitle.length < 4) return [];

  const products = await getPrisma().product.findMany({
    where: {
      ...(normalizedCategory
        ? {
            category: {
              equals: normalizedCategory,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
    },
    select: {
      id: true,
      title: true,
      category: true,
    },
  });

  return products
    .map((product) => ({
      ...product,
      title: normalizeDecodedText(product.title),
      category: normalizeDecodedText(product.category),
      score: getSimilarityScore(decodedTitle, product.title),
    }))
    .filter((product) => product.score >= minimumScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);
}

async function assertProductDoesNotExist(
  title: string,
  category: string,
  excludeProductId?: number,
) {
  const products = await getPrisma().product.findMany({
    where: {
      category: {
        equals: category,
        mode: "insensitive",
      },
      ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
    },
    select: {
      id: true,
      title: true,
      category: true,
    },
  });
  const normalizedTitle = normalizeDecodedText(title).toLowerCase();
  const duplicate = products.find(
    (product) =>
      normalizeDecodedText(product.title).toLowerCase() === normalizedTitle,
  );

  if (duplicate) {
    throw new Error(
      `Product already exists: ${duplicate.title} (${duplicate.category}, ID ${duplicate.id}).`,
    );
  }

  const similarProducts = await findSimilarProducts({
    title,
    category,
    excludeProductId,
    minimumScore: 0.82,
  });
  if (similarProducts.length > 0) {
    const similar = similarProducts[0];
    throw new Error(
      `Similar product already exists: ${similar.title} (${similar.category}, ID ${similar.id}).`,
    );
  }
}

function normalizeAdminProductInput(
  input: AdminCreateProductInput | AdminUpdateProductInput,
) {
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
      id: offer.id,
      merchantName,
      price,
      original,
      url,
      status: offer.status.trim() || "New",
      availability: offer.availability.trim() || "unknown",
    };
  });

  return {
    title,
    category,
    image,
    offers,
  };
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
  const { title, category, image, offers } = normalizeAdminProductInput(input);

  const prisma = getPrisma();
  await assertProductDoesNotExist(title, category);
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

export async function updateAdminProduct({
  productId,
  input,
  actor,
}: {
  productId: number;
  input: AdminUpdateProductInput;
  actor: AdminActor;
}) {
  const { title, category, image, offers } = normalizeAdminProductInput(input);

  const prisma = getPrisma();

  const updated = await prisma.$transaction(async (transaction) => {
    const before = await transaction.product.findUnique({
      where: { id: productId },
      include: {
        offers: true,
      },
    });

    if (!before) {
      throw new Error(`Product ${productId} was not found.`);
    }

    const titleOrCategoryChanged =
      normalizeDecodedText(before.title).toLowerCase() !== title.toLowerCase() ||
      normalizeDecodedText(before.category).toLowerCase() !==
        category.toLowerCase();
    if (titleOrCategoryChanged) {
      await assertProductDoesNotExist(title, category, productId);
    }

    const existingOfferIds = new Set(before.offers.map((offer) => offer.id));
    const retainedOfferIds = new Set<number>();
    const savedOffers = [];

    const product = await transaction.product.update({
      where: { id: productId },
      data: {
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

      if (offer.id) {
        if (!existingOfferIds.has(offer.id)) {
          throw new Error(`Offer ${offer.id} does not belong to product ${productId}.`);
        }

        retainedOfferIds.add(offer.id);
        savedOffers.push(
          await transaction.offer.update({
            where: { id: offer.id },
            data: {
              merchantId: merchant.id,
              site: offer.merchantName,
              price: offer.price,
              original: offer.original,
              url: offer.url,
              status: offer.status,
              availability: offer.availability,
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
      } else {
        const createdOffer = await transaction.offer.create({
          data: {
            productId,
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
        });
        retainedOfferIds.add(createdOffer.id);
        savedOffers.push(createdOffer);
      }
    }

    const offerIdsToDelete = before.offers
      .map((offer) => offer.id)
      .filter((offerId) => !retainedOfferIds.has(offerId));
    if (offerIdsToDelete.length > 0) {
      await transaction.offer.deleteMany({
        where: {
          productId,
          id: {
            in: offerIdsToDelete,
          },
        },
      });
    }

    await transaction.adminAuditLog.create({
      data: {
        action: "update_product",
        targetType: "product",
        targetId: getTargetId(product.id),
        actor,
        before: toAuditJson(before),
        after: toAuditJson({ product, offers: savedOffers }),
      },
    });

    return {
      product,
      offers: savedOffers,
    };
  });

  return updated;
}
