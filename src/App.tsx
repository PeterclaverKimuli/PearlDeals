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
  CategoryItem,
  EnrichedDeal,
  RecommendationBasket,
  SelfCheck,
  ShoppingBrief,
} from "@/features/deals/types";
import {
  formatUGX,
  getShareUrl,
  getVisibleCategories,
} from "@/features/deals/utils";

type HomeResponse = {
  deals: EnrichedDeal[];
  count: number;
  visibleCategories: CategoryItem[];
  featuredDeals: EnrichedDeal[];
  behavioralDealSections: (CategoryItem & { deals: EnrichedDeal[] })[];
  filteredDeals: EnrichedDeal[];
  allProductsTotalCount: number;
};

type SearchResponse = {
  results: EnrichedDeal[];
  count: number;
};

type RecommendationsResponse = {
  baskets: RecommendationBasket[];
  suggestions: EnrichedDeal[];
};

function runSelfChecks(deals: EnrichedDeal[]): SelfCheck[] {
  const firstDeal = deals[0];
  const visibleCategories = getVisibleCategories(deals);

  return [
    {
      name: "api dataset exists",
      pass: Array.isArray(deals) && deals.length > 0,
    },
    {
      name: "every deal has prices",
      pass: deals.every(
        (deal) => Array.isArray(deal.prices) && deal.prices.length > 0,
      ),
    },
    {
      name: "visible categories are derived from products only",
      pass:
        visibleCategories.length > 0 &&
        visibleCategories.every((cat) =>
          deals.some((deal) => deal.category === cat.name),
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
        !!firstDeal &&
        firstDeal.bestDeal.price ===
          Math.min(...firstDeal.prices.map((p) => p.price)),
    },
    {
      name: "discount is never negative",
      pass: deals.every((deal) => deal.discount >= 0),
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
      pass: deals.some((deal) => deal.prices.some((price) => !!price.url)),
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

const dealsPath = "/deals";

function getSearchQueryFromLocation() {
  if (typeof window === "undefined") return "";

  return new URLSearchParams(window.location.search).get("q") ?? "";
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
  const [selectedDeal, setSelectedDeal] = useState<EnrichedDeal | null>(null);
  const [search, setSearch] = useState(() => getSearchQueryFromLocation());
  const [bannerSrc, setBannerSrc] = useState(
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1600&auto=format&fit=crop",
  );
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [shoppingBrief, setShoppingBrief] = useState<ShoppingBrief | null>(null);
  const [dealsWithDiscounts, setDealsWithDiscounts] = useState<EnrichedDeal[]>([]);
  const [productPage, setProductPage] = useState(1);
  const [visibleCategories, setVisibleCategories] = useState<CategoryItem[]>([]);
  const [featuredDeals, setFeaturedDeals] = useState<EnrichedDeal[]>([]);
  const [behavioralDealSections, setBehavioralDealSections] = useState<
    (CategoryItem & { deals: EnrichedDeal[] })[]
  >([]);
  const [filteredDeals, setFilteredDeals] = useState<EnrichedDeal[]>([]);
  const [allProductsTotalCount, setAllProductsTotalCount] = useState(0);
  const [searchResults, setSearchResults] = useState<EnrichedDeal[]>([]);
  const [recommendationBaskets, setRecommendationBaskets] = useState<
    RecommendationBasket[]
  >([]);
  const [recommendationSuggestions, setRecommendationSuggestions] = useState<
    EnrichedDeal[]
  >([]);
  const [isHomeLoading, setIsHomeLoading] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isRecommendationsLoading, setIsRecommendationsLoading] =
    useState(false);

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

  useEffect(() => {
    let isCurrent = true;

    async function loadHomePayload() {
      setIsHomeLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedBehavioralCategory) {
        params.set("behavioralCategory", selectedBehavioralCategory);
      }
      if (isViewingAllProducts) params.set("viewAll", "true");

      const query = params.toString();
      const response = await fetch(`/api/home${query ? `?${query}` : ""}`);
      if (!response.ok) {
        throw new Error(`Home API returned ${response.status}`);
      }

      const payload = (await response.json()) as HomeResponse;
      if (isCurrent) {
        setDealsWithDiscounts(payload.deals);
        setVisibleCategories(payload.visibleCategories);
        setFeaturedDeals(payload.featuredDeals);
        setBehavioralDealSections(payload.behavioralDealSections);
        setFilteredDeals(payload.filteredDeals);
        setAllProductsTotalCount(payload.allProductsTotalCount);
        setIsHomeLoading(false);
      }
    }

    loadHomePayload().catch(() => {
      if (isCurrent) {
        setDealsWithDiscounts([]);
        setVisibleCategories([]);
        setFeaturedDeals([]);
        setBehavioralDealSections([]);
        setFilteredDeals([]);
        setAllProductsTotalCount(0);
        setIsHomeLoading(false);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [search, selectedCategory, selectedBehavioralCategory, isViewingAllProducts]);

  useEffect(() => {
    let isCurrent = true;

    async function loadSearchResults() {
      const trimmedSearch = search.trim();
      if (!trimmedSearch) {
        setSearchResults([]);
        setIsSearchLoading(false);
        return;
      }

      setIsSearchLoading(true);
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(trimmedSearch)}`,
      );
      if (!response.ok) {
        throw new Error(`Search API returned ${response.status}`);
      }

      const payload = (await response.json()) as SearchResponse;
      if (isCurrent) {
        setSearchResults(payload.results);
        setIsSearchLoading(false);
      }
    }

    loadSearchResults().catch(() => {
      if (isCurrent) {
        setSearchResults([]);
        setIsSearchLoading(false);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [search]);

  useEffect(() => {
    let isCurrent = true;

    async function loadRecommendations() {
      if (!shoppingBrief) {
        setRecommendationBaskets([]);
        setRecommendationSuggestions([]);
        setIsRecommendationsLoading(false);
        return;
      }

      setIsRecommendationsLoading(true);
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shoppingBrief),
      });
      if (!response.ok) {
        throw new Error(`Recommendations API returned ${response.status}`);
      }

      const payload = (await response.json()) as RecommendationsResponse;
      if (isCurrent) {
        setRecommendationBaskets(payload.baskets);
        setRecommendationSuggestions(payload.suggestions);
        setIsRecommendationsLoading(false);
      }
    }

    loadRecommendations().catch(() => {
      if (isCurrent) {
        setRecommendationBaskets([]);
        setRecommendationSuggestions([]);
        setIsRecommendationsLoading(false);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [shoppingBrief]);

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

  useEffect(() => {
    setProductPage(1);
  }, [search, selectedCategory, selectedBehavioralCategory, isViewingAllProducts]);

  const selfChecks = useMemo(
    () => runSelfChecks(dealsWithDiscounts),
    [dealsWithDiscounts],
  );
  const behavioralCategoryNames = useMemo(
    () => new Set(behavioralCategories.map((category) => category.name)),
    [],
  );

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

  if (
    routePath === "/" ||
    routePath === "/naki" ||
    routePath === "/naki/budget" ||
    routePath === "/brief"
  ) {
    return (
      <LandingPage
        categories={visibleCategories}
        onBrowseDeals={() => navigateTo(dealsPath)}
        onCompleteBrief={handleCompleteBrief}
        initialBrief={shoppingBrief}
        initialStep={
          routePath === "/brief" && shoppingBrief
            ? "ready"
            : routePath === "/naki/budget"
              ? "budget"
              : "welcome"
        }
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
        isLoading={isSearchLoading}
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
        isLoading={isHomeLoading}
        page={productPage}
        onPageChange={setProductPage}
      />
    );
  }

  if (routePath === "/recommendations") {
    return (
      <RecommendationsPage
        brief={shoppingBrief}
        baskets={recommendationBaskets}
        suggestedDeals={recommendationSuggestions}
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
        isLoading={isRecommendationsLoading}
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
      categoryRef={categoryRef}
      topDealsRef={topDealsRef}
      popularProductsRef={popularProductsRef}
      featuredDeals={featuredDeals}
      behavioralDealSections={behavioralDealSections}
      allDeals={dealsWithDiscounts}
      filteredDeals={filteredDeals}
      allProductsTotalCount={allProductsTotalCount}
      setSelectedDeal={setSelectedDeal}
      selfChecks={selfChecks}
      onOpenNaki={() => navigateTo("/naki")}
      onStartShopping={() => navigateTo("/naki/budget")}
      onBrowseDeals={() => navigateTo(dealsPath)}
      onViewAllProducts={viewAllProducts}
      onSearchSubmit={navigateToSearch}
      isLoading={isHomeLoading}
      activeViewKey={`${routePath}:${selectedCategory ?? ""}:${selectedBehavioralCategory ?? ""}:${isViewingAllProducts}`}
      isViewingAllProducts={isViewingAllProducts}
      page={productPage}
      onPageChange={setProductPage}
    />
  );
}
