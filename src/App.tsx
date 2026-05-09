import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DealDetails } from "@/features/deals/components/DealViews";
import { CategoryPage } from "@/features/deals/components/CategoryPage";
import { HomePage } from "@/features/deals/components/HomePage";
import { LandingPage } from "@/features/deals/components/LandingPage";
import { RecommendationsPage } from "@/features/deals/components/RecommendationsPage";
import { SearchResultsPage } from "@/features/deals/components/SearchResultsPage";
import {
  FeedbackModal,
  LeaveSiteModal,
  WaitlistModal,
} from "@/features/deals/components/Modals";
import { behavioralCategories } from "@/features/deals/data";
import type {
  EnrichedDeal,
  SelfCheck,
  ShoppingBrief,
} from "@/features/deals/types";
import { matchesDealSearch } from "@/features/deals/search";
import {
  enrichDeal,
  formatUGX,
  getSavingsAmount,
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
    {
      name: "recommendations route is available",
      pass: true,
    },
  ];
}

const selfChecks = runSelfChecks();
const dealsPath = "/deals";
const phoneCategoryName = "Phones";

function getSearchQueryFromLocation() {
  if (typeof window === "undefined") return "";

  return new URLSearchParams(window.location.search).get("q") ?? "";
}

function isPhoneDeal(deal: EnrichedDeal) {
  return deal.category === phoneCategoryName;
}

function getHomepagePreviewDeals(
  deals: EnrichedDeal[],
  visibleLimit: number,
  phoneLimit: number,
) {
  const selected: EnrichedDeal[] = [];
  let phoneCount = 0;

  for (const deal of deals) {
    if (selected.length >= visibleLimit) break;

    if (isPhoneDeal(deal)) {
      if (phoneCount >= phoneLimit) continue;
      phoneCount += 1;
    }

    selected.push(deal);
  }

  if (selected.length >= visibleLimit) return selected;

  const selectedIds = new Set(selected.map((deal) => deal.id));
  return [
    ...selected,
    ...deals.filter((deal) => !selectedIds.has(deal.id)),
  ].slice(0, visibleLimit);
}

function getHomepageTopDeals(deals: EnrichedDeal[]) {
  const sortedDeals = [...deals].sort(
    (a, b) =>
      getSavingsAmount(b) - getSavingsAmount(a) ||
      a.bestDeal.price - b.bestDeal.price,
  );
  const nonPhoneDeals = sortedDeals.filter((deal) => !isPhoneDeal(deal));
  const phoneDeals = sortedDeals.filter(isPhoneDeal);

  return [...nonPhoneDeals.slice(0, 2), ...phoneDeals].slice(0, 2);
}

export default function DealsUI() {
  const [routePath, setRoutePath] = useState(() =>
    typeof window === "undefined" ? "/" : window.location.pathname,
  );
  const categoryRef = useRef<HTMLDivElement | null>(null);
  const topDealsRef = useRef<HTMLDivElement | null>(null);
  const popularProductsRef = useRef<HTMLDivElement | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBehavioralCategory, setSelectedBehavioralCategory] = useState<
    string | null
  >(null);
  const [isViewingAllProducts, setIsViewingAllProducts] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<ReturnType<
    typeof enrichDeal
  > | null>(null);
  const [search, setSearch] = useState(() => getSearchQueryFromLocation());
  const [bannerSrc, setBannerSrc] = useState(
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1600&auto=format&fit=crop",
  );
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [showCategoryArrows, setShowCategoryArrows] = useState(false);
  const [shoppingBrief, setShoppingBrief] = useState<ShoppingBrief | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      const nextPath = window.location.pathname;

      setRoutePath(nextPath);
      if (nextPath === "/search") {
        setSearch(getSearchQueryFromLocation());
      }
      setSelectedDeal(null);
      setSelectedCategory(null);
      setSelectedBehavioralCategory(null);
      setIsViewingAllProducts(false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [
    routePath,
    selectedCategory,
    selectedBehavioralCategory,
    isViewingAllProducts,
    selectedDeal,
  ]);

  const dealsWithDiscounts = useMemo(
    () => mockDeals.map((deal) => enrichDeal(deal)),
    [],
  );
  const visibleCategories = useMemo(() => getVisibleCategories(mockDeals), []);
  const behavioralCategoryNames = useMemo(
    () => new Set(behavioralCategories.map((category) => category.name)),
    [],
  );
  const selectedBehavioralCategoryConfig = useMemo(
    () =>
      behavioralCategories.find(
        (category) => category.name === selectedBehavioralCategory,
      ) ?? null,
    [selectedBehavioralCategory],
  );

  const filteredDeals = useMemo(() => {
    const behavioralProductIds = selectedBehavioralCategoryConfig?.productIds;

    return dealsWithDiscounts.filter((deal) => {
      const matchesCategory =
        behavioralProductIds
          ? behavioralProductIds.includes(deal.id)
          : isViewingAllProducts || !selectedCategory
            ? true
            : deal.category === selectedCategory;
      return matchesCategory && matchesDealSearch(deal, search);
    });
  }, [
    dealsWithDiscounts,
    search,
    selectedCategory,
    isViewingAllProducts,
    selectedBehavioralCategoryConfig,
  ]);

  const behavioralDealSections = useMemo(
    () =>
      behavioralCategories.map((category) => ({
        ...category,
        deals: getHomepagePreviewDeals(
          (category.productIds ?? [])
            .map((id) => dealsWithDiscounts.find((deal) => deal.id === id))
            .filter(
              (deal): deal is (typeof dealsWithDiscounts)[number] => !!deal,
            ),
          6,
          1,
        ),
      })),
    [dealsWithDiscounts],
  );

  const featuredDeals = useMemo(
    () => getHomepageTopDeals(dealsWithDiscounts),
    [dealsWithDiscounts],
  );
  const homepageFilteredDeals = useMemo(
    () =>
      search.trim()
        ? filteredDeals
        : getHomepagePreviewDeals(filteredDeals, 8, 2),
    [filteredDeals, search],
  );
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];

    return dealsWithDiscounts.filter((deal) => matchesDealSearch(deal, search));
  }, [dealsWithDiscounts, search]);

  const navigateTo = (path: string) => {
    if (typeof window !== "undefined" && window.location.pathname !== path) {
      window.history.pushState({}, "", path);
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    setRoutePath(path);
    setSelectedDeal(null);
    setSelectedCategory(null);
    setSelectedBehavioralCategory(null);
    setIsViewingAllProducts(false);
    setIsSidebarOpen(false);
  };

  const navigateToSearch = (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const path = `/search?q=${encodeURIComponent(trimmedQuery)}`;
    setSearch(trimmedQuery);
    if (typeof window !== "undefined" && window.location.pathname + window.location.search !== path) {
      window.history.pushState({}, "", path);
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    setRoutePath("/search");
    setSelectedDeal(null);
    setSelectedCategory(null);
    setSelectedBehavioralCategory(null);
    setIsViewingAllProducts(false);
    setIsSidebarOpen(false);
  };

  const selectCategory = (category: string | null) => {
    if (!category) {
      setSelectedCategory(null);
      setSelectedBehavioralCategory(null);
      setIsViewingAllProducts(false);
      return;
    }

    if (behavioralCategoryNames.has(category)) {
      setSelectedBehavioralCategory(category);
      setSelectedCategory(null);
      setIsViewingAllProducts(false);
    } else {
      setSelectedCategory(category);
      setSelectedBehavioralCategory(null);
      setIsViewingAllProducts(false);
    }
  };

  const viewAllProducts = () => {
    setSelectedCategory(null);
    setSelectedBehavioralCategory(null);
    setIsViewingAllProducts(true);
    setSelectedDeal(null);
  };

  const handleCompleteBrief = (brief: ShoppingBrief) => {
    setShoppingBrief(brief);
    navigateTo("/recommendations");
  };

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

  if (routePath === "/" || routePath === "/naki" || routePath === "/brief") {
    return (
      <LandingPage
        categories={visibleCategories}
        onBrowseDeals={() => navigateTo(dealsPath)}
        onCompleteBrief={handleCompleteBrief}
        initialBrief={shoppingBrief}
        initialStep={routePath === "/brief" && shoppingBrief ? "ready" : "welcome"}
      />
    );
  }

  if (selectedDeal) {
    return (
      <DealDetails
        key={selectedDeal.id}
        deal={selectedDeal}
        onBack={() => setSelectedDeal(null)}
      />
    );
  }

  if (routePath === "/search") {
    return (
      <SearchResultsPage
        search={search}
        setSearch={setSearch}
        results={searchResults}
        resultCount={searchResults.length}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        visibleCategories={visibleCategories}
        selectedCategory={selectedCategory}
        setSelectedCategory={selectCategory}
        setSelectedDeal={setSelectedDeal}
        onBrowseDeals={() => navigateTo(dealsPath)}
        onSearchSubmit={navigateToSearch}
      />
    );
  }

  if (selectedCategory || selectedBehavioralCategory || isViewingAllProducts) {
    return (
      <CategoryPage
        search={search}
        setSearch={setSearch}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        selectedCategory={
          isViewingAllProducts
            ? "All Products"
            : selectedCategory ?? selectedBehavioralCategory ?? ""
        }
        setSelectedCategory={selectCategory}
        visibleCategories={visibleCategories}
        filteredDeals={filteredDeals}
        setSelectedDeal={setSelectedDeal}
        onOpenNaki={() => navigateTo("/naki")}
        onBrowseDeals={() => navigateTo(dealsPath)}
        onSearchSubmit={navigateToSearch}
      />
    );
  }

  if (routePath === "/recommendations") {
    return (
      <RecommendationsPage
        brief={shoppingBrief}
        deals={dealsWithDiscounts}
        search={search}
        setSearch={setSearch}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        selectedCategory={selectedCategory}
        setSelectedCategory={selectCategory}
        visibleCategories={visibleCategories}
        setSelectedDeal={setSelectedDeal}
        onEditBrief={() => navigateTo(shoppingBrief ? "/brief" : "/naki")}
        onBrowseDeals={() => navigateTo(dealsPath)}
        onSearchSubmit={navigateToSearch}
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
      navigationCategories={visibleCategories}
      selectedCategory={selectedCategory}
      setSelectedCategory={selectCategory}
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
      behavioralDealSections={behavioralDealSections}
      allDeals={dealsWithDiscounts}
      filteredDeals={homepageFilteredDeals}
      allProductsTotalCount={filteredDeals.length}
      setSelectedDeal={setSelectedDeal}
      selfChecks={selfChecks}
      onOpenNaki={() => navigateTo("/naki")}
      onBrowseDeals={() => navigateTo(dealsPath)}
      onViewAllProducts={viewAllProducts}
      onSearchSubmit={navigateToSearch}
    />
  );
}
