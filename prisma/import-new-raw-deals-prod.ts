import { Client } from "pg";
import { config } from "dotenv";
import { rawDeals } from "../src/features/deals/data.ts";
import { normalizeDeals } from "../shared/deals/logic.ts";

config({ path: ".env.local" });
config();

const dryRun = process.argv.includes("--dry-run");
const confirmProdWrite = process.env.CONFIRM_PROD_WRITE === "import-missing-raw-deals";
const databaseUrl = process.env.DATABASE_URL;
const deals = normalizeDeals(rawDeals);

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const client = new Client({
  connectionString: databaseUrl,
});

async function productExists(id: number) {
  const result = await client.query<{ exists: boolean }>(
    'select exists(select 1 from "Product" where id = $1) as exists',
    [id],
  );

  return result.rows[0]?.exists ?? false;
}

async function main() {
  await client.connect();

  try {
    const missingDeals = [];

    for (const deal of deals) {
      if (!(await productExists(deal.id))) {
        missingDeals.push(deal);
      }
    }

    console.log(`Raw deals in source: ${deals.length}`);
    console.log(`Missing PROD products to import: ${missingDeals.length}`);
    missingDeals.forEach((deal) => {
      console.log(`- ${deal.id}: ${deal.title}`);
    });

    if (dryRun) {
      console.log("Dry run complete. No database writes were made.");
      return;
    }

    if (!confirmProdWrite) {
      throw new Error(
        'Production import requires CONFIRM_PROD_WRITE="import-missing-raw-deals".',
      );
    }

    await client.query("begin");

    for (const deal of missingDeals) {
      await client.query(
        'insert into "Product" (id, title, image, category, "createdAt", "updatedAt") values ($1, $2, $3, $4, now(), now())',
        [deal.id, deal.title, deal.image, deal.category],
      );

      for (const price of deal.prices) {
        await client.query(
          'insert into "Offer" ("productId", site, price, original, url, status, "createdAt", "updatedAt") values ($1, $2, $3, $4, $5, $6, now(), now())',
          [
            deal.id,
            price.site,
            price.price,
            price.original,
            price.url ?? null,
            price.status ?? null,
          ],
        );
      }
    }

    await client.query("commit");

    const productCount = await client.query<{ count: string }>(
      'select count(*)::text as count from "Product" where id < 10000',
    );
    const offerCount = await client.query<{ count: string }>(
      'select count(*)::text as count from "Offer" where "productId" < 10000',
    );

    console.log(
      `Imported ${missingDeals.length} missing raw deals into PROD. Raw product count: ${productCount.rows[0]?.count}. Raw offer count: ${offerCount.rows[0]?.count}.`,
    );
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
