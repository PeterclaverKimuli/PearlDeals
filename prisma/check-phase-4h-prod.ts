import { Client } from "pg";
import { getProdDatabaseUrl } from "./prod-database.ts";

const requiredTables = ["Merchant", "PriceSnapshot", "ScrapeRun", "ScrapeJob"];
const requiredOfferColumns = [
  "merchantId",
  "availability",
  "lastScrapedAt",
  "lastSuccessfulScrapeAt",
  "failureCount",
  "scrapeStatus",
  "externalId",
  "canonicalUrl",
];

const client = new Client({
  connectionString: getProdDatabaseUrl(),
});

async function tableExists(tableName: string) {
  const result = await client.query<{ exists: boolean }>(
    `
      select exists(
        select 1
        from information_schema.tables
        where table_schema = 'public'
          and table_name = $1
      ) as exists
    `,
    [tableName],
  );

  return result.rows[0]?.exists ?? false;
}

async function columnExists(tableName: string, columnName: string) {
  const result = await client.query<{ exists: boolean }>(
    `
      select exists(
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = $1
          and column_name = $2
      ) as exists
    `,
    [tableName, columnName],
  );

  return result.rows[0]?.exists ?? false;
}

async function main() {
  await client.connect();

  try {
    const tableChecks = [];
    for (const table of requiredTables) {
      tableChecks.push({
        table,
        exists: await tableExists(table),
      });
    }

    const offerColumnChecks = [];
    for (const column of requiredOfferColumns) {
      offerColumnChecks.push({
        column,
        exists: await columnExists("Offer", column),
      });
    }
    const schemaReady =
      tableChecks.every((check) => check.exists) &&
      offerColumnChecks.every((check) => check.exists);

    const counts = await client.query<{
      product_count: string;
      offer_count: string;
    }>(
      `
        select
          (select count(*)::text from "Product") as product_count,
          (select count(*)::text from "Offer") as offer_count
      `,
    );
    let productionState = null;

    if (schemaReady) {
      const state = await client.query<{
        unlinked_offer_count: string;
        enabled_merchant_count: string;
        failed_offer_count: string;
        price_snapshot_count: string;
        scrape_run_count: string;
      }>(
        `
          select
            (select count(*)::text from "Offer" where "merchantId" is null) as unlinked_offer_count,
            (select count(*)::text from "Merchant" where enabled = true) as enabled_merchant_count,
            (select count(*)::text from "Offer" where "scrapeStatus" = 'failed') as failed_offer_count,
            (select count(*)::text from "PriceSnapshot") as price_snapshot_count,
            (select count(*)::text from "ScrapeRun") as scrape_run_count
        `,
      );
      productionState = {
        unlinkedOfferCount: Number(state.rows[0]?.unlinked_offer_count ?? 0),
        enabledMerchantCount: Number(state.rows[0]?.enabled_merchant_count ?? 0),
        failedOfferCount: Number(state.rows[0]?.failed_offer_count ?? 0),
        priceSnapshotCount: Number(state.rows[0]?.price_snapshot_count ?? 0),
        scrapeRunCount: Number(state.rows[0]?.scrape_run_count ?? 0),
      };
    }

    const nextStep = !schemaReady
      ? 'Run CONFIRM_PROD_WRITE="prisma-prod" npm.cmd run db:push:prod.'
      : productionState?.unlinkedOfferCount
        ? "Run merchants:backfill:prod:dry-run, then the guarded backfill write."
        : productionState?.enabledMerchantCount
          ? "Production scraping foundation is ready. Keep pilots conservative before scheduling."
          : "Run scrape:enable-prod:dry-run, then the guarded enable write.";

    console.log(
      JSON.stringify(
        {
          schemaReady,
          productCount: Number(counts.rows[0]?.product_count ?? 0),
          offerCount: Number(counts.rows[0]?.offer_count ?? 0),
          productionState,
          tableChecks,
          offerColumnChecks,
          nextStep,
        },
        null,
        2,
      ),
    );

    if (!schemaReady) {
      process.exitCode = 1;
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
