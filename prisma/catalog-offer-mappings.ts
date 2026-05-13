export type CatalogOfferMapping = {
  productId: number;
  merchant: string;
  price: number;
  original?: number;
  url: string;
  status?: "New" | "Refurbished" | "Used";
};

export const catalogOfferMappings: CatalogOfferMapping[] = [];
