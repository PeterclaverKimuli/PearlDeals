import type { RefObject } from "react";
import { usePostHog } from "@posthog/react";
import { DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { makeSvgDataUri } from "../data";
import type { CategoryItem, EnrichedDeal, SelfCheck } from "../types";
import { AppHeaderShell, MobileOffcanvas, ValueProp } from "./AppChrome";
import { DealCard, FeaturedDealBanner } from "./DealViews";
import { FeedbackModal } from "./Modals";

export function HomePage({
  search,
  setSearch,
  isSidebarOpen,
  setIsSidebarOpen,
  visibleCategories,
  selectedCategory,
  setSelectedCategory,
  isFeedbackOpen,
  setIsFeedbackOpen,
  bannerSrc,
  setBannerSrc,
  scrollToTopDeals,
  showCategoryArrows,
  categoryRef,
  topDealsRef,
  popularProductsRef,
  featuredDeals,
  filteredDeals,
  setSelectedDeal,
  selfChecks,
}: {
  search: string;
  setSearch: (value: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
  visibleCategories: CategoryItem[];
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  isFeedbackOpen: boolean;
  setIsFeedbackOpen: (value: boolean) => void;
  bannerSrc: string;
  setBannerSrc: (value: string) => void;
  scrollToTopDeals: () => void;
  showCategoryArrows: boolean;
  categoryRef: RefObject<HTMLDivElement | null>;
  topDealsRef: RefObject<HTMLDivElement | null>;
  popularProductsRef: RefObject<HTMLDivElement | null>;
  featuredDeals: EnrichedDeal[];
  filteredDeals: EnrichedDeal[];
  setSelectedDeal: (deal: EnrichedDeal) => void;
  selfChecks: SelfCheck[];
}) {
  const posthog = usePostHog();

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-4 md:px-6 md:pb-6">
      <AppHeaderShell
        search={search}
        setSearch={setSearch}
        showMenuButton
        onMenuClick={() => setIsSidebarOpen(true)}
        maxWidthClass="max-w-6xl"
      />

      <div className="mx-auto max-w-6xl">
        <MobileOffcanvas
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSelectCategory={setSelectedCategory}
          selectedCategory={selectedCategory}
          categoriesToShow={visibleCategories}
        />

        <button
          type="button"
          onClick={() => setIsFeedbackOpen(true)}
          className="fixed right-4 bottom-4 z-[75] inline-flex h-14 max-w-[calc(100vw-2rem)] cursor-pointer items-center gap-2 rounded-full bg-green-600 px-5 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-green-700 md:right-6 md:bottom-6 md:max-w-none"
        >
          💬 Feedback
        </button>

        <FeedbackModal
          key={isFeedbackOpen ? "feedback-open" : "feedback-closed"}
          open={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
        />

        <div className="relative mt-4 mb-8 overflow-hidden rounded-2xl bg-gray-100">
          <img
            src={bannerSrc}
            alt="Deals banner"
            onError={() => setBannerSrc(makeSvgDataUri("Fresh deals", "#d1fae5"))}
            className="h-96 w-full object-cover md:h-[28rem]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black to-transparent opacity-70" />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-lg px-6 md:px-10">
              <h2 className="mb-3 text-2xl font-bold leading-tight text-white md:text-4xl">
                Get the best deals
                <br />
                on your favorite products
              </h2>
              <p className="mb-4 text-sm text-white opacity-80 md:text-base">
                Compare prices across top sites and save more every day.
              </p>
              <Button
                className="cursor-pointer rounded-full bg-white px-5 py-2 text-sm text-black hover:bg-gray-200"
                onClick={scrollToTopDeals}
              >
                Let&apos;s Get it →
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-4 py-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Featured Categories</h2>
            {showCategoryArrows && (
              <div className="hidden gap-2 md:flex">
                <button
                  onClick={() =>
                    categoryRef.current?.scrollBy({
                      left: -300,
                      behavior: "smooth",
                    })
                  }
                  className="flex h-10 w-10 cursor-pointer justify-center rounded-full bg-gray-200 text-3xl text-gray-500 hover:bg-gray-300"
                  type="button"
                >
                  ‹
                </button>
                <button
                  onClick={() =>
                    categoryRef.current?.scrollBy({
                      left: 300,
                      behavior: "smooth",
                    })
                  }
                  className="flex h-10 w-10 cursor-pointer justify-center rounded-full bg-gray-200 text-3xl text-gray-500 hover:bg-gray-300"
                  type="button"
                >
                  ›
                </button>
              </div>
            )}
          </div>

          <div
            ref={categoryRef}
            className={`flex w-full gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${showCategoryArrows ? "justify-start" : "justify-center"}`}
          >
            {visibleCategories.map((cat) => (
              <div
                key={cat.name}
                onClick={() => {
                  posthog.capture("category_clicked", {
                    category: cat.name,
                    source: "homepage",
                  });

                  setSelectedCategory(cat.name);
                }}
                className="group flex h-28 min-w-[120px] flex-shrink-0 cursor-pointer flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl transition group-hover:scale-110">
                  {cat.icon}
                </div>
                <span className="text-center text-xs font-medium text-gray-700">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {featuredDeals.length > 0 && (
          <>
            <div ref={topDealsRef} className="mb-3 flex items-center gap-2">
              <span className="animate-pulse">🔥</span>
              <h2 className="animate-pulse text-2xl font-bold tracking-tight">
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

        <div
          ref={popularProductsRef}
          className="mb-4 flex items-center justify-between gap-3"
        >
          <h2 className="text-xl font-semibold">Popular Products</h2>
          <div className="text-xs text-gray-500">
            {selfChecks.every((check) => check.pass)
              ? "Checks passed"
              : "Check warnings"}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 min-[425px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDeals.map((deal) => (
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
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-4">
          <ValueProp
            icon="⚡"
            title="Real-Time Deals"
            description="Discover the latest price drops instantly across top sites."
          />
          <ValueProp
            icon={<DollarSign className="h-6 w-6" />}
            title="Best Prices Guaranteed"
            description="We compare prices so you always get the best value."
          />
          <ValueProp
            icon="🛍️"
            title="Multiple Sites"
            description="Browse deals from trusted retailers all in one place."
          />
          <ValueProp
            icon="🔄"
            title="Easy Comparisons"
            description="Quickly compare prices and choose what works for you."
          />
        </div>
      </div>
    </div>
  );
}
