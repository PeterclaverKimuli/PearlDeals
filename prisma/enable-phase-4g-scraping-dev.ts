import { createDevPrismaClient } from "./dev-database.ts";
import { assertMerchantScrapingAllowed } from "../server/scrapers/policy.ts";

const merchantSlugs = ["kanta", "jiji", "tilyexpress"] as const;
const prisma = createDevPrismaClient();

async function main() {
  const policies = merchantSlugs.map((slug) => assertMerchantScrapingAllowed(slug));
  const merchants = await prisma.$transaction(
    merchantSlugs.map((slug) =>
      prisma.merchant.update({
        where: { slug },
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
      }),
    ),
  );

  console.log(
    JSON.stringify(
      {
        merchants,
        policies: policies.map((policy) => ({
          merchantSlug: policy.merchantSlug,
          reviewedAt: policy.reviewedAt,
          maxRequestsPerMinute: policy.maxRequestsPerMinute,
          userAgent: policy.userAgent,
        })),
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
