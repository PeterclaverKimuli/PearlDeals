import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

export function getProdDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (process.env.DATABASE_URL_DEV && process.env.DATABASE_URL_DEV === databaseUrl) {
    throw new Error("DATABASE_URL must not be the same as DATABASE_URL_DEV.");
  }

  return databaseUrl;
}

export function assertProdWriteConfirmation(expectedValue: string) {
  if (process.env.CONFIRM_PROD_WRITE !== expectedValue) {
    throw new Error(`Production writes require CONFIRM_PROD_WRITE="${expectedValue}".`);
  }
}

export function createProdPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: getProdDatabaseUrl(),
    }),
  });
}
