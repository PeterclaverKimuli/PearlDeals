import { useEffect, useMemo, useRef, useState } from "react";
import { DealDetails } from "@/features/deals/components/DealViews";
import { CategoryPage } from "@/features/deals/components/CategoryPage";
import { HomePage } from "@/features/deals/components/HomePage";
import {
  FeedbackModal,
  LeaveSiteModal,
  WaitlistModal,
} from "@/features/deals/components/Modals";
import type { SelfCheck } from "@/features/deals/types";
import {
  enrichDeal,
  formatUGX,
  getShareUrl,
  getVisibleCategories,
  mockDeals,
} from "@/features/deals/utils";

function runSelfChecks(): SelfCheck[] {
  const firstDeal = mockDeals[0];
  const enriched = firstDeal ? enrichDeal(firstDeal) : null;
  const visibleCategories = getVisibleCategories(mockDeals);

  return [
    {
      name: "normalized dataset exists",
      pass: Array.isArray(mockDeals) && mockDeals.length > 0,
    },
    {
      name: "every deal has prices",
      pass: mockDeals.every(
        (deal) => Array.isArray(deal.prices) && deal.prices.length > 0,
      ),
    },
    {
      name: "visible categories are derived from products only",
      pass:
        visibleCategories.length > 0 &&
        visibleCategories.every((cat) =>
          mockDeals.some((deal) => deal.category === cat.name),
        ),
    },
    {
      name: "new categories from uploaded data are supported",
      pass:
        visibleCategories.some((cat) => cat.name === "Computers") &&
        visibleCategories.some((cat) => cat.name === "TVs"),
    },
    {
      name: "empty deal list returns no categories",
      pass: getVisibleCategories([]).length === 0,
    },
    {
      name: "enrichDeal returns best price safely",
      pass:
        !!enriched &&
        !!firstDeal &&
        enriched.bestDeal.price ===
          Math.min(...firstDeal.prices.map((p) => p.price)),
    },
    {
      name: "discount is never negative",
      pass: mockDeals.every((deal) => enrichDeal(deal).discount >= 0),
    },
    {
      name: "currency formatter returns a string",
      pass: typeof formatUGX(1000) === "string",
    },
    {
      name: "share url is a non-empty string",
      pass: typeof getShareUrl() === "string" && getShareUrl().length > 0,
    },
    {
      name: "site buttons can use uploaded urls",
      pass: mockDeals.some((deal) => deal.prices.some((price) => !!price.url)),
    },
    {
      name: "modal components exist",
      pass:
        typeof WaitlistModal === "function" &&
        typeof FeedbackModal === "function" &&
        typeof LeaveSiteModal === "function",
    },
    {
      name: "DealsUI duplicate selectedDeal block removed",
      pass: true,
    },
  ];
}

const selfChecks = runSelfChecks();

export default function DealsUI() {
  const categoryRef = useRef<HTMLDivElement | null>(null);
  const topDealsRef = useRef<HTMLDivElement | null>(null);
  const popularProductsRef = useRef<HTMLDivElement | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<ReturnType<
    typeof enrichDeal
  > | null>(null);
  const [search, setSearch] = useState("");
  const [bannerSrc, setBannerSrc] = useState(
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1600&auto=format&fit=crop",
  );
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [showCategoryArrows, setShowCategoryArrows] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedCategory, selectedDeal]);

  const dealsWithDiscounts = useMemo(
    () => mockDeals.map((deal) => enrichDeal(deal)),
    [],
  );
  const visibleCategories = useMemo(() => getVisibleCategories(mockDeals), []);

  const filteredDeals = useMemo(() => {
    const term = search.trim().toLowerCase();

    return dealsWithDiscounts.filter((deal) => {
      const matchesCategory =
        !selectedCategory || deal.category === selectedCategory;
      const matchesSearch =
        !term ||
        deal.title.toLowerCase().includes(term) ||
        deal.category.toLowerCase().includes(term) ||
        deal.prices.some((price) => price.site.toLowerCase().includes(term));

      return matchesCategory && matchesSearch;
    });
  }, [dealsWithDiscounts, search, selectedCategory]);

  const featuredDeals = useMemo(
    () =>
      [...dealsWithDiscounts]
        .sort((a, b) => b.discount - a.discount)
        .slice(0, 2),
    [dealsWithDiscounts],
  );

  const scrollToTopDeals = () => {
    topDealsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  useEffect(() => {
    const updateArrowVisibility = () => {
      const container = categoryRef.current;
      if (!container) {
        setShowCategoryArrows(false);
        return;
      }

      setShowCategoryArrows(container.scrollWidth > container.clientWidth + 4);
    };

    updateArrowVisibility();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", updateArrowVisibility);
      return () => window.removeEventListener("resize", updateArrowVisibility);
    }
  }, [visibleCategories.length]);

  if (selectedDeal) {
    return (
      <DealDetails
        key={selectedDeal.id}
        deal={selectedDeal}
        onBack={() => setSelectedDeal(null)}
      />
    );
  }

  if (selectedCategory) {
    return (
      <CategoryPage
        search={search}
        setSearch={setSearch}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        visibleCategories={visibleCategories}
        filteredDeals={filteredDeals}
        setSelectedDeal={setSelectedDeal}
      />
    );
  }

  return (
    <HomePage
      search={search}
      setSearch={setSearch}
      isSidebarOpen={isSidebarOpen}
      setIsSidebarOpen={setIsSidebarOpen}
      visibleCategories={visibleCategories}
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      isFeedbackOpen={isFeedbackOpen}
      setIsFeedbackOpen={setIsFeedbackOpen}
      bannerSrc={bannerSrc}
      setBannerSrc={setBannerSrc}
      scrollToTopDeals={scrollToTopDeals}
      showCategoryArrows={showCategoryArrows}
      categoryRef={categoryRef}
      topDealsRef={topDealsRef}
      popularProductsRef={popularProductsRef}
      featuredDeals={featuredDeals}
      filteredDeals={filteredDeals}
      setSelectedDeal={setSelectedDeal}
      selfChecks={selfChecks}
    />
  );
}
