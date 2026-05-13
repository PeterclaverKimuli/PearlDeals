import {
  printCatalogValidation,
  validateCatalogProducts,
} from "./catalog-validation.ts";

const result = validateCatalogProducts();
printCatalogValidation(result);

if (!result.valid) {
  process.exitCode = 1;
}
