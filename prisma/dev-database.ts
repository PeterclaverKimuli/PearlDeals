import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

export function getDevDatabaseUrl() {
  const databaseUrlDev = process.env.DATABASE_URL_DEV;

  if (!databaseUrlDev) {
    throw new Error("DATABASE_URL_DEV is not configured.");
  }

  if (process.env.DATABASE_URL && process.env.DATABASE_URL === databaseUrlDev) {
    throw new Error("DATABASE_URL_DEV must not be the same as DATABASE_URL.");
  }

  return databaseUrlDev;
}

export function createDevPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: getDevDatabaseUrl(),
    }),
  });
}
