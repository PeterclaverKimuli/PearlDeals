import { createDevPrismaClient } from "./dev-database.ts";
import { createMerchantSlug, inferMerchantBaseUrl } from "./merchant-utils.ts";

const dryRun = process.argv.includes("--dry-run");
const prisma = createDevPrismaClient();

async function main() {
  const offers = await prisma.offer.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      site: true,
      url: true,
      merchantId: true,
    },
  });

  const merchantBySlug = new Map<
    string,
    {
      name: string;
      slug: string;
      baseUrl: string | null;
      offerIds: number[];
    }
  >();

  for (const offer of offers) {
    const slug = createMerchantSlug(offer.site);
    if (!slug) {
      throw new Error(`Offer ${offer.id} has an invalid site value.`);
    }

    const existing = merchantBySlug.get(slug);
    const baseUrl = inferMerchantBaseUrl(offer.site, offer.url);

    if (existing) {
      if (!existing.baseUrl && baseUrl) existing.baseUrl = baseUrl;
      existing.offerIds.push(offer.id);
      continue;
    }

    merchantBySlug.set(slug, {
      name: offer.site,
      slug,
      baseUrl,
      offerIds: [offer.id],
    });
  }

  console.log(`Found ${offers.length} offers across ${merchantBySlug.size} merchants.`);

  for (const merchant of merchantBySlug.values()) {
    console.log(
      `- ${merchant.name} (${merchant.slug}): ${merchant.offerIds.length} offers`,
    );
  }

  if (dryRun) {
    console.log("Dry run complete. No database writes were made.");
    return;
  }

  for (const merchant of merchantBySlug.values()) {
    const savedMerchant = await prisma.merchant.upsert({
      where: { slug: merchant.slug },
      update: {
        name: merchant.name,
        baseUrl: merchant.baseUrl,
      },
      create: {
        name: merchant.name,
        slug: merchant.slug,
        baseUrl: merchant.baseUrl,
        enabled: false,
        scrapeStrategy: null,
      },
    });

    await prisma.offer.updateMany({
      where: {
        site: merchant.name,
        merchantId: null,
      },
      data: {
        merchantId: savedMerchant.id,
      },
    });
  }

  const unlinkedOfferCount = await prisma.offer.count({
    where: { merchantId: null },
  });
  const merchantCount = await prisma.merchant.count();

  console.log(
    `Backfilled merchants in DEV. Merchants: ${merchantCount}. Unlinked offers: ${unlinkedOfferCount}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
