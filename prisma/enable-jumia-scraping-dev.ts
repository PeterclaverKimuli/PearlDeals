import { createDevPrismaClient } from "./dev-database.ts";
import { assertMerchantScrapingAllowed } from "../server/scrapers/policy.ts";

const prisma = createDevPrismaClient();

async function main() {
  const policy = assertMerchantScrapingAllowed("jumia");
  const merchant = await prisma.merchant.update({
    where: { slug: "jumia" },
    data: {
      enabled: true,
      scrapeStrategy: "fetch-html",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      enabled: true,
      scrapeStrategy: true,
    },
  });

  console.log(
    JSON.stringify(
      {
        merchant,
        policy: {
          reviewedAt: policy.reviewedAt,
          maxRequestsPerMinute: policy.maxRequestsPerMinute,
          userAgent: policy.userAgent,
        },
      },
      null,
      2,
    ),
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
