import {
  catalogProducts,
  expectedCatalogCategoryCount,
  expectedCatalogProductCount,
  expectedCatalogProductsPerCategory,
  type CatalogProduct,
} from "./catalog-products.ts";

export type CatalogValidationResult = {
  valid: boolean;
  errors: string[];
  categoryCounts: Map<string, number>;
};

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateCatalogProducts(
  products: CatalogProduct[] = catalogProducts,
): CatalogValidationResult {
  const errors: string[] = [];
  const categoryCounts = new Map<string, number>();
  const seenProductKeys = new Set<string>();

  if (products.length !== expectedCatalogProductCount) {
    errors.push(
      `Expected ${expectedCatalogProductCount} products, found ${products.length}.`,
    );
  }

  products.forEach((product, index) => {
    const row = index + 1;
    const category = product.category.trim();
    const title = product.title.trim();
    const image = product.image.trim();

    if (!category) errors.push(`Product ${row} has an empty category.`);
    if (!title) errors.push(`Product ${row} has an empty title.`);
    if (!image) errors.push(`Product ${row} has an empty image URL.`);
    if (image && !isValidHttpUrl(image)) {
      errors.push(`Product ${row} has an invalid image URL: ${image}`);
    }

    if (category) {
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }

    const productKey = `${category.toLowerCase()}::${title.toLowerCase()}`;
    if (seenProductKeys.has(productKey)) {
      errors.push(`Product ${row} duplicates category/title: ${category} / ${title}`);
    }
    seenProductKeys.add(productKey);
  });

  if (categoryCounts.size !== expectedCatalogCategoryCount) {
    errors.push(
      `Expected ${expectedCatalogCategoryCount} categories, found ${categoryCounts.size}.`,
    );
  }

  for (const [category, expectedCount] of Object.entries(
    expectedCatalogProductsPerCategory,
  )) {
    const count = categoryCounts.get(category) ?? 0;

    if (count !== expectedCount) {
      errors.push(
        `Expected ${expectedCount} products in ${category}, found ${count}.`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    categoryCounts,
  };
}

export function printCatalogValidation(result: CatalogValidationResult) {
  console.log(`Catalog products: ${catalogProducts.length}`);
  console.log(`Catalog categories: ${result.categoryCounts.size}`);

  for (const [category, count] of result.categoryCounts) {
    console.log(`- ${category}: ${count}`);
  }

  if (result.valid) {
    console.log("Catalog validation passed.");
    return;
  }

  console.error("Catalog validation failed:");
  result.errors.forEach((error) => console.error(`- ${error}`));
}
