import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { usePostHog } from "@posthog/react";
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Flame,
  ShieldCheck,
  Sparkles,
  Store,
  Tags,
  TrendingDown,
} from "lucide-react";
import feedbackAvatar from "@/assets/Feedback prompt.webp";
import { Button } from "@/components/ui/button";
import type { CategoryItem, EnrichedDeal, SelfCheck } from "../types";
import { formatUGX, getSavingsAmount } from "../utils";
import { AppHeaderShell, MobileOffcanvas, ValueProp } from "./AppChrome";
import { DealCard, FeaturedDealBanner } from "./DealViews";
import { FloatingNakiButton } from "./FloatingNakiButton";
import { LoadingState } from "./LoadingState";
import { paginateItems, Pagination } from "./Pagination";
import { FeedbackModal, NakiScrollPromptModal } from "./Modals";

const nakiScrollModalStorageKey = "pearldeals:naki-scroll-modal-shown:v2";
const showNakiScrollPrompt = false;

export function HomePage({
  search,
  setSearch,
  isSidebarOpen,
  setIsSidebarOpen,
  visibleCategories,
  navigationCategories,
  selectedCategory,
  setSelectedCategory,
  isFeedbackOpen,
  setIsFeedbackOpen,
  bannerSrc,
  setBannerSrc,
  scrollToTopDeals,
  categoryRef,
  topDealsRef,
  popularProductsRef,
  featuredDeals,
  behavioralDealSections,
  allDeals,
  filteredDeals,
  allProductsTotalCount,
  setSelectedDeal,
  selfChecks,
  onOpenNaki,
  onStartShopping,
  onBrowseDeals,
  onViewAllProducts,
  onSearchSubmit,
  isLoading,
  activeViewKey,
  isViewingAllProducts,
  page,
  onPageChange,
}: {
  search: string;
  setSearch: (value: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
  visibleCategories: CategoryItem[];
  navigationCategories: CategoryItem[];
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  isFeedbackOpen: boolean;
  setIsFeedbackOpen: (value: boolean) => void;
  bannerSrc: string;
  setBannerSrc: (value: string) => void;
  scrollToTopDeals: () => void;
  categoryRef: RefObject<HTMLDivElement | null>;
  topDealsRef: RefObject<HTMLDivElement | null>;
  popularProductsRef: RefObject<HTMLDivElement | null>;
  featuredDeals: EnrichedDeal[];
  behavioralDealSections: (CategoryItem & { deals: EnrichedDeal[] })[];
  allDeals: EnrichedDeal[];
  filteredDeals: EnrichedDeal[];
  allProductsTotalCount: number;
  setSelectedDeal: (deal: EnrichedDeal) => void;
  selfChecks: SelfCheck[];
  onOpenNaki: () => void;
  onStartShopping: () => void;
  onBrowseDeals: () => void;
  onViewAllProducts: () => void;
  onSearchSubmit: (query: string) => void;
  isLoading: boolean;
  activeViewKey: string;
  isViewingAllProducts: boolean;
  page: number;
  onPageChange: (page: number) => void;
}) {
  const posthog = usePostHog();
  const heroRef = useRef<HTMLElement | null>(null);
  const lastScrollYRef = useRef(0);
  const [isNakiScrollModalOpen, setIsNakiScrollModalOpen] = useState(false);
  const [showCategoryArrows, setShowCategoryArrows] = useState(false);
  const [hasShownNakiScrollModal, setHasShownNakiScrollModal] = useState(() => {
    if (typeof window === "undefined") return false;

    return window.sessionStorage.getItem(nakiScrollModalStorageKey) === "true";
  });
  const showFeedbackButton = false;
  const storeCount = new Set(
    allDeals.flatMap((deal) => deal.prices.map((price) => price.site)),
  ).size;
  const biggestSaving = Math.max(0, ...allDeals.map(getSavingsAmount));
  const bestHeroDeal = featuredDeals[0] ?? allDeals[0];
  const {
    pageItems: visibleProductDeals,
    pageCount: productsPageCount,
    safePage: productsPage,
  } = isViewingAllProducts
    ? paginateItems(filteredDeals, page)
    : {
        pageItems: filteredDeals,
        pageCount: 1,
        safePage: 1,
      };
  const heroStats = [
    {
      label: "Products tracked",
      value: allProductsTotalCount.toString(),
      icon: <Tags className="h-4 w-4" />,
    },
    {
      label: "Categories",
      value: visibleCategories.length.toString(),
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      label: "Stores compared",
      value: storeCount.toString(),
      icon: <Store className="h-4 w-4" />,
    },
    {
      label: "Top saving found",
      value: formatUGX(biggestSaving),
      icon: <TrendingDown className="h-4 w-4" />,
    },
  ];

  const markNakiScrollModalShown = useCallback(() => {
    setHasShownNakiScrollModal(true);

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(nakiScrollModalStorageKey, "true");
    }
  }, []);

  const closeNakiScrollModal = useCallback(() => {
    markNakiScrollModalShown();
    setIsNakiScrollModalOpen(false);
  }, [markNakiScrollModalShown]);

  const startShoppingFromScrollModal = useCallback(() => {
    closeNakiScrollModal();
    onStartShopping();
  }, [closeNakiScrollModal, onStartShopping]);

  useEffect(() => {
    if (
      !showNakiScrollPrompt ||
      typeof window === "undefined" ||
      hasShownNakiScrollModal ||
      isNakiScrollModalOpen
    ) {
      return;
    }

    const heroElement = heroRef.current;
    if (!heroElement) return;

    lastScrollYRef.current = window.scrollY;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        const currentScrollY = window.scrollY;
        const isScrollingDown = currentScrollY > lastScrollYRef.current;
        lastScrollYRef.current = currentScrollY;

        if (
          isScrollingDown &&
          !entry.isIntersecting &&
          entry.boundingClientRect.bottom <= 0
        ) {
          markNakiScrollModalShown();
          setIsNakiScrollModalOpen(true);
          observer.disconnect();
        }
      },
      { threshold: 0 },
    );

    observer.observe(heroElement);

    return () => observer.disconnect();
  }, [hasShownNakiScrollModal, isNakiScrollModalOpen, markNakiScrollModalShown]);

  useEffect(() => {
    const container = categoryRef.current;
    if (!container) {
      setShowCategoryArrows(false);
      return;
    }

    const updateArrowVisibility = () => {
      setShowCategoryArrows(container.scrollWidth > container.clientWidth + 4);
    };

    updateArrowVisibility();
    const frameId = window.requestAnimationFrame(updateArrowVisibility);
    const secondFrameId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(updateArrowVisibility);
    });
    const timeoutId = window.setTimeout(updateArrowVisibility, 250);
    const lateTimeoutId = window.setTimeout(updateArrowVisibility, 750);

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateArrowVisibility)
        : null;

    observer?.observe(container);
    Array.from(container.children).forEach((child) => observer?.observe(child));
    window.addEventListener("resize", updateArrowVisibility);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.cancelAnimationFrame(secondFrameId);
      window.clearTimeout(timeoutId);
      window.clearTimeout(lateTimeoutId);
      observer?.disconnect();
      window.removeEventListener("resize", updateArrowVisibility);
    };
  }, [activeViewKey, categoryRef, isLoading, visibleCategories.length]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#f7fee7_30%,#f9fafb_58%)] px-4 pb-4 text-gray-950 md:px-6 md:pb-6">
      <AppHeaderShell
        search={search}
        setSearch={setSearch}
        showMenuButton
        onMenuClick={() => setIsSidebarOpen(true)}
        onHomeClick={onBrowseDeals}
        maxWidthClass="max-w-6xl"
        resultCount={allProductsTotalCount}
        onSearchSubmit={onSearchSubmit}
      />

      <div className="mx-auto max-w-6xl">
        <MobileOffcanvas
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSelectCategory={setSelectedCategory}
          selectedCategory={selectedCategory}
          categoriesToShow={navigationCategories}
        />

        {showFeedbackButton ? (
          <button
            type="button"
            onClick={() => setIsFeedbackOpen(true)}
            className="fixed right-4 bottom-4 z-[75] inline-flex h-14 max-w-[calc(100vw-2rem)] cursor-pointer items-center gap-2 rounded-full bg-green-600 px-5 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-green-700 md:right-6 md:bottom-6 md:max-w-none"
          >
            Feedback
          </button>
        ) : (
          <FloatingNakiButton
            source="homepage"
            title="Need better deals?"
            description="Tell Naki your budget and get matched deals."
            badge="Free help"
            onOpenNaki={onOpenNaki}
          />
        )}

        <FeedbackModal
          key={isFeedbackOpen ? "feedback-open" : "feedback-closed"}
          open={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
        />

        {showNakiScrollPrompt ? (
          <NakiScrollPromptModal
            open={isNakiScrollModalOpen}
            onClose={closeNakiScrollModal}
            onStartShopping={startShoppingFromScrollModal}
          />
        ) : null}

        {isLoading ? (
          <div className="mt-4">
            <LoadingState
              title="Loading deals"
              body="Getting the latest product comparisons ready."
            />
          </div>
        ) : (
          <>
        <section
          ref={heroRef}
          className="relative mt-4 mb-8 overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-gray-950 shadow-2xl shadow-emerald-950/20"
        >
          <img
            src={bannerSrc}
            alt="Deals banner"
            onError={() => setBannerSrc(bestHeroDeal?.image ?? bannerSrc)}
            className="absolute inset-0 h-full w-full object-cover opacity-25 saturate-125"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_24%,rgba(250,204,21,0.34),transparent_28%),linear-gradient(110deg,rgba(6,78,59,0.98),rgba(17,24,39,0.94)_52%,rgba(15,23,42,0.72))]" />

          <div className="relative grid min-h-[34rem] gap-8 px-5 py-8 md:px-10 md:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-12">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-50 backdrop-blur">
                <BadgeCheck className="h-4 w-4 text-amber-300" />
                Live price comparisons across trusted stores
              </div>

              <h2 className="text-4xl font-black leading-[1.03] text-white md:text-5xl lg:text-6xl">
                Compare prices before you buy.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-emerald-50/85 md:text-lg">
                PearlDeals scans local offers, highlights real savings, and
                helps you choose the best store before your money leaves your
                pocket.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  className="h-12 cursor-pointer rounded-full bg-amber-300 px-6 text-sm font-bold text-gray-950 shadow-lg shadow-amber-950/20 hover:bg-amber-200"
                  onClick={scrollToTopDeals}
                >
                  Start saving now
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-12 cursor-pointer rounded-full border-white/30 bg-white/10 px-6 text-sm font-semibold text-white hover:bg-white/20 hover:text-white"
                  onClick={onOpenNaki}
                >
                  Ask Naki for help
                </Button>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 md:max-w-xl xl:max-w-none xl:grid-cols-4">
                {heroStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur"
                  >
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-amber-200">
                      {stat.icon}
                    </div>
                    <p className="text-lg font-black text-white">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-xs leading-4 text-emerald-50/70">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {bestHeroDeal ? (
              <div className="relative mx-auto w-full max-w-md lg:max-w-md">
                <div className="absolute -top-4 right-8 z-10 rounded-full bg-red-500 px-4 py-2 text-sm font-black text-white shadow-xl shadow-red-950/30">
                  Save {formatUGX(getSavingsAmount(bestHeroDeal))}
                </div>
                <div className="rounded-[1.75rem] border border-white/15 bg-white p-4 shadow-2xl">
                  <div className="rounded-[1.25rem] bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-4">
                    <img
                      src={bestHeroDeal.image}
                      alt={bestHeroDeal.title}
                      className="mx-auto h-52 w-full object-contain drop-shadow-xl"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                      Best deal spotlight
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-xl font-black leading-tight text-gray-950">
                      {bestHeroDeal.title}
                    </h3>
                    <div className="mt-4 flex flex-col gap-3 min-[425px]:flex-row min-[425px]:items-end min-[425px]:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">
                          Lowest price at {bestHeroDeal.bestDeal.site}
                        </p>
                        <p className="text-2xl font-black text-emerald-700">
                          {formatUGX(bestHeroDeal.bestDeal.price)}
                        </p>
                      </div>
                      <Button
                        className="h-10 shrink-0 cursor-pointer rounded-full bg-gray-950 px-4 text-white hover:bg-gray-800"
                        onClick={() => setSelectedDeal(bestHeroDeal)}
                      >
                        Compare
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <div className="mb-4 rounded-[1.75rem] bg-white/70 px-5 py-7 shadow-sm ring-1 ring-gray-950/5 backdrop-blur md:px-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Shop by need
              </p>
              <h2 className="text-2xl font-black tracking-tight">
                Featured Categories
              </h2>
            </div>
            {showCategoryArrows && (
              <div className="hidden gap-2 md:flex">
                <button
                  onClick={() =>
                    categoryRef.current?.scrollBy({
                      left: -300,
                      behavior: "smooth",
                    })
                  }
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-emerald-50"
                  type="button"
                  aria-label="Scroll categories left"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() =>
                    categoryRef.current?.scrollBy({
                      left: 300,
                      behavior: "smooth",
                    })
                  }
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-emerald-50"
                  type="button"
                  aria-label="Scroll categories right"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          <div
            ref={categoryRef}
            className={`flex w-full gap-4 overflow-x-auto px-1 pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${showCategoryArrows ? "justify-start" : "justify-center"}`}
          >
            {visibleCategories.map((cat, index) => {
              const count = allDeals.filter(
                (deal) => deal.category === cat.name,
              ).length;
              const palette =
                categoryTilePalettes[index % categoryTilePalettes.length];

              return (
                <div
                  key={cat.name}
                  onClick={() => {
                    posthog.capture("category_clicked", {
                      category: cat.name,
                      source: "homepage",
                    });

                    setSelectedCategory(cat.name);
                  }}
                  className={`group relative flex h-36 min-w-[150px] flex-shrink-0 cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border p-4 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${palette}`}
                >
                  <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/35" />
                  <div className="relative flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-sm transition group-hover:scale-110">
                      {cat.icon}
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-700/60 transition group-hover:translate-x-1 group-hover:text-gray-900" />
                  </div>
                  <div className="relative">
                    <h3 className="text-base font-black text-gray-950">
                      {cat.name}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-gray-700">
                      {count} {count === 1 ? "deal" : "deals"} compared
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {featuredDeals.length > 0 && (
          <>
            <div ref={topDealsRef} className="mb-3 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Flame className="h-5 w-5" />
              </span>
              <h2 className="text-2xl font-black tracking-tight">
                Top Deals Today
              </h2>
            </div>

            <div className="mb-8 grid auto-rows-fr gap-6 md:grid-cols-2">
              {featuredDeals.map((deal) => (
                <FeaturedDealBanner
                  key={deal.id}
                  deal={deal}
                  onSelect={setSelectedDeal}
                />
              ))}
            </div>
          </>
        )}

        <div className="mb-10 space-y-8">
          {behavioralDealSections.map((section) => (
            <div key={section.name} className="space-y-8">
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <span className="mt-0.5 text-xl" aria-hidden="true">
                      {section.icon}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-black">
                        {section.name}
                      </h2>
                      {section.description ? (
                        <p className="mt-1 text-sm text-gray-500">
                          {section.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm"
                    onClick={() => {
                      posthog.capture("view_all_clicked", {
                        category: section.name,
                        source: "homepage_behavioral_category",
                      });
                      setSelectedCategory(section.name);
                    }}
                  >
                    View All
                  </Button>
                </div>

                <div className="flex items-stretch gap-4 overflow-x-auto pt-2 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {section.deals.slice(0, 6).map((deal) => (
                    <div
                      key={`${section.name}-${deal.id}`}
                      className="flex w-[78vw] shrink-0 min-[425px]:w-[18rem] md:w-[18rem] lg:w-[calc((100%_-_4rem)/5)] lg:min-w-[calc((100%_-_4rem)/5)]"
                    >
                      <DealCard deal={deal} onSelect={setSelectedDeal} />
                    </div>
                  ))}
                </div>
              </section>
              {section.name === "Popular Deals" ? (
                <NakiBudgetHelpRequest onOpenNaki={onOpenNaki} />
              ) : null}
            </div>
          ))}
        </div>

        <div
          ref={popularProductsRef}
          className="mb-4 flex items-center justify-between gap-3"
        >
          <h2 className="text-2xl font-black tracking-tight">All Products</h2>
          <div className="text-xs text-gray-500">
            {selfChecks.every((check) => check.pass)
              ? "Checks passed"
              : "Check warnings"}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 min-[425px]:grid-cols-2 md:grid-cols-4">
          {visibleProductDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onSelect={setSelectedDeal} />
          ))}

          {search.trim() && (
            <div className="col-span-full mt-6 flex justify-center">
              <Button
                onClick={() => setSearch("")}
                variant="outline"
                className="cursor-pointer rounded-full px-6 py-2 text-sm"
              >
                Clear search results
              </Button>
            </div>
          )}
          {isViewingAllProducts ? (
            <Pagination
              page={productsPage}
              pageCount={productsPageCount}
              onPageChange={onPageChange}
            />
          ) : null}
        </div>

        {!search.trim() && allProductsTotalCount > 8 && (
          <div className="mt-6 flex justify-center">
            <Button
              type="button"
              variant="outline"
              className="block h-10 w-full cursor-pointer rounded-xl px-6 text-sm font-semibold sm:w-1/2 lg:w-1/4"
              onClick={() => {
                posthog.capture("view_all_clicked", {
                  category: "All Products",
                  source: "homepage_all_products",
                });
                onViewAllProducts();
              }}
            >
              View All
            </Button>
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-4">
          <ValueProp
            icon={<Sparkles className="h-6 w-6" />}
            title="Real-Time Deals"
            description="Discover the latest price drops instantly across top sites."
          />
          <ValueProp
            icon={<DollarSign className="h-6 w-6" />}
            title="Best Prices Guaranteed"
            description="We compare prices so you always get the best value."
          />
          <ValueProp
            icon={<Store className="h-6 w-6" />}
            title="Multiple Sites"
            description="Browse deals from trusted retailers all in one place."
          />
          <ValueProp
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Easy Comparisons"
            description="Quickly compare prices and choose what works for you."
          />
        </div>
          </>
        )}
      </div>
    </div>
  );
}

const categoryTilePalettes = [
  "border-emerald-200 bg-emerald-100",
  "border-amber-200 bg-amber-100",
  "border-sky-200 bg-sky-100",
  "border-rose-200 bg-rose-100",
  "border-violet-200 bg-violet-100",
  "border-lime-200 bg-lime-100",
  "border-orange-200 bg-orange-100",
];

function NakiBudgetHelpRequest({ onOpenNaki }: { onOpenNaki: () => void }) {
  const posthog = usePostHog();

  return (
    <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm shadow-emerald-950/5 md:p-6">
      <div className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-center">
        <div className="flex items-start gap-3 md:contents">
          <div className="h-16 w-16 shrink-0 md:h-24 md:w-24">
            <img
              src={feedbackAvatar}
              alt="Naki asking about shopping budgets"
              className="h-full w-full object-contain object-center"
            />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold text-green-700">
              Need help shopping?
            </p>
            <h2 className="mt-1 text-xl font-black leading-snug text-gray-950 md:text-2xl">
              Looking for items within your budget?
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Tell me what you need and how much you want to spend, and I will
              help you compare options.
            </p>
          </div>
        </div>
        <Button
          type="button"
          className="h-11 cursor-pointer rounded-full bg-green-600 px-5 text-white hover:bg-green-700"
          onClick={() => {
            posthog.capture("naki_budget_help_clicked", {
              source: "homepage_after_popular_deals",
            });
            onOpenNaki();
          }}
        >
          Ask Naki
        </Button>
      </div>
    </section>
  );
}
