import { catalogProductIdStart, catalogProducts } from "./catalog-products.ts";
import {
  printCatalogValidation,
  validateCatalogProducts,
} from "./catalog-validation.ts";
import { createDevPrismaClient, getDevDatabaseUrl } from "./dev-database.ts";

const dryRun = process.argv.includes("--dry-run");
const prisma = createDevPrismaClient();

function getProductId(index: number) {
  return catalogProductIdStart + index;
}

async function main() {
  const validation = validateCatalogProducts();
  printCatalogValidation(validation);

  if (!validation.valid) {
    throw new Error("Catalog import blocked until validation passes.");
  }

  getDevDatabaseUrl();

  if (dryRun) {
    console.log("Dry run complete. No database writes were made.");
    return;
  }

  for (const [index, product] of catalogProducts.entries()) {
    await prisma.product.upsert({
      where: { id: getProductId(index) },
      update: {
        title: product.title,
        image: product.image,
        category: product.category,
      },
      create: {
        id: getProductId(index),
        title: product.title,
        image: product.image,
        category: product.category,
      },
    });
  }

  console.log(`Imported ${catalogProducts.length} catalog products into DEV.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
