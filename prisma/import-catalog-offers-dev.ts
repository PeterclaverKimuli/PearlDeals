import { catalogOfferMappings } from "./catalog-offer-mappings.ts";
import { catalogProductIdStart, catalogProducts } from "./catalog-products.ts";
import { createDevPrismaClient } from "./dev-database.ts";
import { createMerchantSlug, inferMerchantBaseUrl } from "./merchant-utils.ts";

const dryRun = process.argv.includes("--dry-run");
const prisma = createDevPrismaClient();

const validCatalogProductIds = new Set(
  catalogProducts.map((_, index) => catalogProductIdStart + index),
);

function validateMappings() {
  const errors: string[] = [];

  catalogOfferMappings.forEach((mapping, index) => {
    const row = index + 1;

    if (!validCatalogProductIds.has(mapping.productId)) {
      errors.push(`Mapping ${row} references unknown productId ${mapping.productId}.`);
    }

    if (!mapping.merchant.trim()) {
      errors.push(`Mapping ${row} has an empty merchant name.`);
    }

    if (!Number.isInteger(mapping.price) || mapping.price <= 0) {
      errors.push(`Mapping ${row} must have a positive integer price.`);
    }

    if (
      mapping.original !== undefined &&
      (!Number.isInteger(mapping.original) || mapping.original <= 0)
    ) {
      errors.push(`Mapping ${row} must have a positive integer original price.`);
    }

    try {
      const url = new URL(mapping.url);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        errors.push(`Mapping ${row} must use an http or https URL.`);
      }
    } catch {
      errors.push(`Mapping ${row} has an invalid URL.`);
    }
  });

  return errors;
}

async function main() {
  const errors = validateMappings();

  console.log(`Catalog offer mappings: ${catalogOfferMappings.length}`);

  if (errors.length > 0) {
    console.error("Catalog offer mapping validation failed:");
    errors.forEach((error) => console.error(`- ${error}`));
    throw new Error("Catalog offer import blocked until validation passes.");
  }

  if (dryRun) {
    console.log("Dry run complete. No database writes were made.");
    return;
  }

  for (const mapping of catalogOfferMappings) {
    const slug = createMerchantSlug(mapping.merchant);
    const merchant = await prisma.merchant.upsert({
      where: { slug },
      update: {
        name: mapping.merchant,
        baseUrl: inferMerchantBaseUrl(mapping.merchant, mapping.url),
      },
      create: {
        name: mapping.merchant,
        slug,
        baseUrl: inferMerchantBaseUrl(mapping.merchant, mapping.url),
        enabled: false,
      },
    });

    const existingOffer = await prisma.offer.findFirst({
      where: {
        productId: mapping.productId,
        merchantId: merchant.id,
        url: mapping.url,
      },
      select: { id: true },
    });

    const offerData = {
      merchantId: merchant.id,
      site: mapping.merchant,
      price: mapping.price,
      original: mapping.original ?? mapping.price,
      url: mapping.url,
      status: mapping.status ?? "New",
      canonicalUrl: mapping.url,
    };

    if (existingOffer) {
      await prisma.offer.update({
        where: { id: existingOffer.id },
        data: offerData,
      });
    } else {
      await prisma.offer.create({
        data: {
          ...offerData,
        productId: mapping.productId,
        },
      });
    }
  }

  console.log(`Imported ${catalogOfferMappings.length} catalog offers into DEV.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
