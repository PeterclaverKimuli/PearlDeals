import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { usePostHog } from "@posthog/react";
import feedbackAvatar from "@/assets/Feedback prompt.webp";
import recommendationAvatar from "@/assets/Ready Prompt - transparent.webp";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ExternalLink,
  ListChecks,
  ShoppingBasket,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import { imageFallback } from "../data";
import type {
  CategoryItem,
  EnrichedDeal,
  PaginationMeta,
  PriceEntry,
  RecommendationBasket,
  RecommendationMatch,
  ShoppingBrief,
} from "../types";
import {
  formatUGX,
  getSavingsAmount,
} from "../utils";
import { matchesDealSearch } from "../search";
import { AppHeaderShell, MobileOffcanvas } from "./AppChrome";
import { DealCard } from "./DealViews";
import { LoadingState } from "./LoadingState";
import {
  LeaveSiteModal,
  RecommendationFeedbackModal,
  UnavailableProductModal,
} from "./Modals";
import { paginateItems, Pagination } from "./Pagination";

export function RecommendationsPage({
  brief,
  baskets,
  suggestedDeals,
  matchingDeals,
  matchingDealsPagination,
  productMatches = [],
  productAnchor,
  productAddOnCategories = [],
  productAddOnMatches = [],
  productRemainingBudget,
  productOriginalBudget,
  productClosestMatches = [],
  productResultState = "not_applicable",
  search,
  setSearch,
  isSidebarOpen,
  setIsSidebarOpen,
  selectedCategory,
  setSelectedCategory,
  visibleCategories,
  setSelectedDeal,
  onSelectBasketDeal,
  restoreBasketShopModalId,
  onBasketShopModalRestored,
  onEditBrief,
  onBrowseDeals,
  onSearchSubmit,
  isLoading,
  onMatchingDealsPageChange,
}: {
  brief: ShoppingBrief | null;
  baskets: RecommendationBasket[];
  suggestedDeals: EnrichedDeal[];
  matchingDeals: EnrichedDeal[];
  matchingDealsPagination: PaginationMeta;
  productMatches?: EnrichedDeal[];
  productAnchor?: EnrichedDeal;
  productAddOnCategories?: string[];
  productAddOnMatches?: EnrichedDeal[];
  productRemainingBudget?: number;
  productOriginalBudget?: number;
  productClosestMatches?: EnrichedDeal[];
  productResultState?:
    | "not_applicable"
    | "exact"
    | "condition_mismatch"
    | "closest"
    | "none";
  search: string;
  setSearch: (value: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  visibleCategories: CategoryItem[];
  setSelectedDeal: (deal: EnrichedDeal) => void;
  onSelectBasketDeal: (basketId: number, deal: EnrichedDeal) => void;
  restoreBasketShopModalId: number | null;
  onBasketShopModalRestored: () => void;
  onEditBrief: () => void;
  onBrowseDeals: () => void;
  onSearchSubmit: (query: string) => void;
  isLoading: boolean;
  onMatchingDealsPageChange: (page: number) => void;
}) {
  const [activeRecommendationsTab, setActiveRecommendationsTab] = useState<
    "baskets" | "matches"
  >("baskets");
  const [isRecommendationFeedbackOpen, setIsRecommendationFeedbackOpen] =
    useState(false);
  const [isUnavailableProductModalOpen, setIsUnavailableProductModalOpen] =
    useState(false);
  const [promptedProductQuery, setPromptedProductQuery] = useState("");
  const briefProductQuery = brief?.productQuery?.trim() ?? "";
  const recommendationFilter = briefProductQuery || search.trim();
  const isProductOnlyBrief = !!briefProductQuery && brief?.categories.length === 0;
  const isProductAddOnBrief =
    !!briefProductQuery && productAddOnCategories.length > 0;
  const hasProductAnchorAddOns = isProductAddOnBrief && !!productAnchor;
  const selectedCategoryCount = brief?.categories.length ?? 0;
  const shouldUseFlatAddOnResults =
    hasProductAnchorAddOns && selectedCategoryCount === 1;
  const shouldUseBasketAddOnResults =
    hasProductAnchorAddOns && selectedCategoryCount >= 2;
  const shouldShowAddOnContext =
    isProductAddOnBrief || (!!briefProductQuery && !!brief?.categories.length);
  const isProductFocusedBrief = !!briefProductQuery;
  const basketFilter = shouldShowAddOnContext ? search.trim() : recommendationFilter;
  const visibleProductAddOnMatches = productAddOnMatches.filter((deal) =>
    matchesDealSearch(deal, search.trim()),
  );

  useEffect(() => {
    if (isProductOnlyBrief) {
      setActiveRecommendationsTab("matches");
    }
  }, [isProductOnlyBrief]);

  useEffect(() => {
    if (
      isLoading ||
      !isProductOnlyBrief ||
      productResultState !== "none" ||
      !briefProductQuery ||
      promptedProductQuery === briefProductQuery
    ) {
      return;
    }

    setPromptedProductQuery(briefProductQuery);
    setIsUnavailableProductModalOpen(true);
  }, [
    briefProductQuery,
    isLoading,
    isProductOnlyBrief,
    productResultState,
    promptedProductQuery,
  ]);

  const visibleBaskets = baskets
    .map((basket) => ({
      basket,
      visibleItems: filterMatchesBySearch(basket.items, basketFilter),
    }))
    .filter(({ visibleItems }) => visibleItems.length > 0);
  const basketMatchCount = visibleBaskets.reduce(
    (total, { visibleItems }) => total + visibleItems.length,
    0,
  );
  const visibleMatchCount = shouldUseFlatAddOnResults
    ? visibleProductAddOnMatches.length
    : shouldUseBasketAddOnResults
      ? activeRecommendationsTab === "baskets"
        ? basketMatchCount
        : visibleProductAddOnMatches.length
      : isProductFocusedBrief
        ? matchingDealsPagination.totalCount
        : basketMatchCount;
  const visibleMatchingDeals = matchingDeals.filter((deal) =>
    matchesDealSearch(deal, recommendationFilter),
  );
  const visibleStoreCount = isProductOnlyBrief
    ? getVisibleStoreCountFromDeals(
        productResultState === "closest"
          ? productClosestMatches
          : visibleMatchingDeals,
      )
    : getVisibleStoreCount(visibleBaskets);
  const shouldShowSingleCategoryProducts =
    !!brief &&
    !briefProductQuery &&
    brief.categories.length === 1 &&
    visibleMatchingDeals.length > 0 &&
    !visibleBaskets.some(({ visibleItems }) => visibleItems.length > 1);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#f7fee7_34%,#f9fafb_62%)] px-4 pb-4 text-gray-950 md:px-6 md:pb-6">
      <AppHeaderShell
        search={search}
        setSearch={setSearch}
        showMenuButton
        onMenuClick={() => setIsSidebarOpen(true)}
        onHomeClick={onBrowseDeals}
        maxWidthClass="max-w-7xl"
        resultCount={visibleMatchCount}
        onSearchSubmit={onSearchSubmit}
      />

      <div className="mx-auto max-w-7xl">
        <MobileOffcanvas
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSelectCategory={setSelectedCategory}
          selectedCategory={selectedCategory}
          categoriesToShow={visibleCategories}
        />

        <section className="mt-10 mb-6 overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.2),transparent_30%),linear-gradient(145deg,#064e3b,#111827)] p-5 text-white shadow-xl shadow-emerald-950/10 min-[375px]:mt-4 md:mt-14 md:p-6 lg:mt-12 min-[1440px]:!mt-4">
          <div className="grid grid-cols-[4rem_1fr] items-center gap-3 min-[375px]:grid-cols-[5rem_1fr] min-[375px]:gap-4 md:grid-cols-[7.5rem_1fr] md:gap-5 lg:grid-cols-[8rem_1fr_auto]">
            <div className="flex shrink-0 items-center justify-center">
              <img
                src={recommendationAvatar}
                alt="Naki presenting recommendations"
                className="h-16 w-16 object-contain object-center drop-shadow-xl min-[375px]:h-20 min-[375px]:w-20 md:h-32 md:w-32"
              />
            </div>
            <div className="grid min-w-0 gap-6 xl:grid-cols-[1fr_auto] xl:items-center xl:gap-4">
              <div className="min-w-0">
                <p className="mb-1.5 inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wide text-amber-200 min-[375px]:mb-2 min-[375px]:gap-2 min-[375px]:text-xs">
                  <Sparkles className="h-3.5 w-3.5 min-[375px]:h-4 min-[375px]:w-4" />
                  Naki picks
                </p>
                <h1 className="text-[1.35rem] font-black leading-tight tracking-normal text-white min-[376px]:text-3xl md:text-4xl">
                  Recommended for you
                </h1>
                {brief ? (
                  <>
                    <BriefChips brief={brief} />
                    {brief.budgetMode === "surprise" ? (
                      <div className="mt-3 w-fit rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-emerald-50 shadow-sm">
                        <p className="text-[0.68rem] font-bold uppercase tracking-wide text-amber-100">
                          Surprise budget picked
                        </p>
                        {typeof brief.budget === "number" ? (
                          <p className="mt-1 text-lg font-black leading-tight text-white">
                            {formatUGX(brief.budget)}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {visibleStoreCount > 0 ? (
                      <div className="mt-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[0.7rem] font-semibold text-emerald-50 min-[375px]:px-3 min-[375px]:text-xs">
                          <Store className="h-3 w-3 min-[375px]:h-3.5 min-[375px]:w-3.5" />
                          Results from {visibleStoreCount}{" "}
                          {visibleStoreCount === 1 ? "store" : "stores"}
                        </span>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-emerald-50/80 md:text-base">
                    Create a shopping brief with Naki to see tailored
                    recommendations.
                  </p>
                )}
              </div>
              {brief ? (
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    className="cursor-pointer rounded-full bg-amber-300 px-4 font-bold text-gray-950 hover:bg-amber-200 dark:bg-amber-300 dark:text-slate-950 dark:shadow-lg dark:shadow-amber-950/20 dark:hover:bg-amber-200"
                    onClick={onEditBrief}
                  >
                    Edit brief
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer rounded-full border-white/30 bg-white/10 px-4 text-white hover:bg-white/20 hover:text-white dark:border-emerald-300/30 dark:!bg-emerald-400/10 dark:!text-emerald-100 dark:shadow-sm dark:shadow-emerald-950/20 dark:hover:!bg-emerald-400/18 dark:hover:!text-white"
                    onClick={onBrowseDeals}
                  >
                    Browse all deals
                  </Button>
                </div>
              ) : null}
          </div>
          </div>

        </section>

        {isLoading ? (
          <LoadingState
            title="Building recommendations"
            body="Naki is matching your brief with the best available deals."
          />
        ) : !brief ? (
          <EmptyRecommendations
            title="No brief yet"
            body="Naki needs your budget, categories, and preferred condition before recommendations can be matched."
            onEditBrief={onEditBrief}
            onBrowseDeals={onBrowseDeals}
          />
        ) : isProductOnlyBrief && brief ? (
          <ProductOnlyRecommendationList
            query={briefProductQuery}
            deals={visibleMatchingDeals}
            closestDeals={productClosestMatches}
            resultState={productResultState}
            pagination={matchingDealsPagination}
            page={matchingDealsPagination.page}
            setSelectedDeal={setSelectedDeal}
            onPageChange={onMatchingDealsPageChange}
            onEditBrief={onEditBrief}
            onBrowseDeals={onBrowseDeals}
            onRequestProduct={() => setIsUnavailableProductModalOpen(true)}
          />
        ) : (
          <section className="space-y-5">
            {hasProductAnchorAddOns ? (
              <ProductAnchorSummary
                query={briefProductQuery}
                productMatches={productMatches.length > 0 ? productMatches : visibleMatchingDeals}
                productAnchor={productAnchor}
                addOnCategories={productAddOnCategories}
                originalBudget={productOriginalBudget}
                remainingBudget={productRemainingBudget}
                setSelectedDeal={setSelectedDeal}
              />
            ) : null}
            {shouldUseFlatAddOnResults ? (
              <ProductAddOnResults
                categories={productAddOnCategories}
                deals={visibleProductAddOnMatches}
                remainingBudget={productRemainingBudget}
                suggestedDeals={suggestedDeals}
                setSelectedDeal={setSelectedDeal}
              />
            ) : shouldShowAddOnContext && !productAnchor ? (
              <ProductQueryFallbackNotice
                query={briefProductQuery}
                resultState={productResultState}
                closestDeals={productClosestMatches}
                setSelectedDeal={setSelectedDeal}
              />
            ) : null}
            {!hasProductAnchorAddOns || shouldUseBasketAddOnResults ? (
            <div className="rounded-3xl border border-emerald-900/10 bg-white/80 p-2 shadow-sm shadow-emerald-950/5 dark:border-white/10 dark:!bg-slate-900/90">
              <div className="grid grid-cols-2 gap-2">
                <RecommendationTabButton
                  active={activeRecommendationsTab === "baskets"}
                  icon={<ShoppingBasket className="h-4 w-4" aria-hidden="true" />}
                  label="Baskets"
                  count={visibleBaskets.length}
                  onClick={() => setActiveRecommendationsTab("baskets")}
                />
                <RecommendationTabButton
                  active={activeRecommendationsTab === "matches"}
                  icon={<ListChecks className="h-4 w-4" aria-hidden="true" />}
                  label="All matches"
                  count={
                    shouldUseBasketAddOnResults
                      ? visibleProductAddOnMatches.length
                      : matchingDealsPagination.totalCount
                  }
                  onClick={() => setActiveRecommendationsTab("matches")}
                />
              </div>
            </div>
            ) : null}

            {shouldUseBasketAddOnResults && productAnchor && activeRecommendationsTab === "baskets" ? (
              <ProductBasketPlanningNote
                anchor={productAnchor}
                categories={productAddOnCategories}
                remainingBudget={productRemainingBudget}
              />
            ) : shouldUseBasketAddOnResults && activeRecommendationsTab === "matches" ? (
              <p className="px-1 text-sm leading-6 text-gray-600 dark:!text-slate-300">
                These are all the add-on products that fit within the remaining
                balance, grouped by category.
              </p>
            ) : !hasProductAnchorAddOns && activeRecommendationsTab === "baskets" ? (
              <p className="px-1 text-sm leading-6 text-gray-600 dark:!text-slate-300">
                Baskets are suggested product combinations that fit your brief,
                budget, and condition preferences.
              </p>
            ) : !hasProductAnchorAddOns ? (
              <p className="px-1 text-sm leading-6 text-gray-600 dark:!text-slate-300">
                All matches shows every product that fits your selected
                categories, budget, and condition preferences.
              </p>
            ) : null}

            {shouldUseBasketAddOnResults && activeRecommendationsTab === "baskets" ? (
              baskets.length > 0 ? (
                visibleBaskets.length > 0 ? (
                  <div className="space-y-5">
                    {visibleBaskets.map(({ basket, visibleItems }) => (
                      <RecommendationBasketView
                        key={basket.id}
                        basket={basket}
                        visibleItems={visibleItems}
                        setSelectedDeal={setSelectedDeal}
                        onSelectBasketDeal={onSelectBasketDeal}
                        restoreBasketShopModalId={restoreBasketShopModalId}
                        onBasketShopModalRestored={onBasketShopModalRestored}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyRecommendations
                    title="No matches found"
                    body="No add-on baskets match your current search."
                    onEditBrief={onEditBrief}
                    onBrowseDeals={onBrowseDeals}
                    showActions={false}
                  />
                )
              ) : (
                <AddOnBudgetEmptyState
                  categories={productAddOnCategories}
                  remainingBudget={productRemainingBudget}
                  suggestedDeals={suggestedDeals}
                  setSelectedDeal={setSelectedDeal}
                />
              )
            ) : shouldUseBasketAddOnResults ? (
              <ProductAddOnGroupedMatches
                categories={productAddOnCategories}
                deals={visibleProductAddOnMatches}
                remainingBudget={productRemainingBudget}
                setSelectedDeal={setSelectedDeal}
                onEditBrief={onEditBrief}
                onBrowseDeals={onBrowseDeals}
              />
            ) : !hasProductAnchorAddOns && activeRecommendationsTab === "baskets" ? (
              shouldShowSingleCategoryProducts ? (
                <SingleCategoryRecommendationList
                  brief={brief}
                  deals={visibleMatchingDeals}
                  pagination={matchingDealsPagination}
                  setSelectedDeal={setSelectedDeal}
                  onPageChange={onMatchingDealsPageChange}
                />
              ) : baskets.length > 0 ? (
                visibleBaskets.length > 0 ? (
                  <div className="space-y-5">
                    {visibleBaskets.map(({ basket, visibleItems }) => (
                      <RecommendationBasketView
                        key={basket.id}
                        basket={basket}
                        visibleItems={visibleItems}
                        setSelectedDeal={setSelectedDeal}
                        onSelectBasketDeal={onSelectBasketDeal}
                        restoreBasketShopModalId={restoreBasketShopModalId}
                        onBasketShopModalRestored={onBasketShopModalRestored}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyRecommendations
                    title="No matches found"
                    body="No recommended products match your current search."
                    onEditBrief={onEditBrief}
                    onBrowseDeals={onBrowseDeals}
                    showActions={false}
                  />
                )
              ) : (
                <NoRecommendationMatches
                  brief={brief}
                  suggestedDeals={suggestedDeals}
                  setSelectedDeal={setSelectedDeal}
                  onEditBrief={onEditBrief}
                  onBrowseDeals={onBrowseDeals}
                />
              )
            ) : !hasProductAnchorAddOns ? (
              <RecommendationAllMatchesList
                brief={brief}
                deals={visibleMatchingDeals}
                pagination={matchingDealsPagination}
                page={matchingDealsPagination.page}
                setSelectedDeal={setSelectedDeal}
                onPageChange={onMatchingDealsPageChange}
                onEditBrief={onEditBrief}
                onBrowseDeals={onBrowseDeals}
              />
            ) : null}
          </section>
        )}

        {brief ? (
          <>
            <RecommendationFeedbackRequest
              onOpen={() => setIsRecommendationFeedbackOpen(true)}
            />
            <RecommendationFeedbackModal
              key={
                isRecommendationFeedbackOpen
                  ? "recommendation-feedback-open"
                  : "recommendation-feedback-closed"
              }
              open={isRecommendationFeedbackOpen}
              onClose={() => setIsRecommendationFeedbackOpen(false)}
              hasBrief
              basketCount={baskets.length}
            />
            <UnavailableProductModal
              open={isUnavailableProductModalOpen}
              onClose={() => setIsUnavailableProductModalOpen(false)}
              searchQuery={briefProductQuery}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

function RecommendationTabButton({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-black transition ${
        active
          ? "bg-gray-950 text-white shadow-md shadow-gray-950/15 dark:bg-emerald-700 dark:text-white dark:shadow-emerald-950/25"
          : "bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 dark:!bg-slate-800 dark:!text-slate-300 dark:hover:!bg-slate-700 dark:hover:!text-emerald-200"
      }`}
      aria-pressed={active}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-[0.68rem] ${
          active
            ? "bg-white/15 text-white"
            : "bg-gray-100 text-gray-500 dark:!bg-slate-700 dark:!text-slate-200"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function ProductAnchorSummary({
  query,
  productMatches,
  productAnchor,
  addOnCategories,
  originalBudget,
  remainingBudget,
  setSelectedDeal,
}: {
  query: string;
  productMatches: EnrichedDeal[];
  productAnchor: EnrichedDeal;
  addOnCategories: string[];
  originalBudget?: number;
  remainingBudget?: number;
  setSelectedDeal: (deal: EnrichedDeal) => void;
}) {
  const sortedMatches = [...productMatches].sort(
    (a, b) =>
      a.bestDeal.price - b.bestDeal.price ||
      b.discount - a.discount ||
      a.title.localeCompare(b.title),
  );

  return (
    <section className="rounded-3xl border border-emerald-900/10 bg-white/80 p-4 shadow-sm shadow-emerald-950/5 dark:border-white/15 dark:!bg-slate-900/90 dark:shadow-black/20 dark:ring-1 dark:ring-white/5 md:p-5">
      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_18rem] lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-green-700 dark:!text-emerald-300">
            Product first
          </p>
          <h2 className="mt-1 text-xl font-black text-gray-950 dark:!text-white">
            {query} options
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-600 dark:!text-slate-300">
            I used the cheapest matching option as the anchor, then checked what
            fits from {addOnCategories.join(", ")} with the balance.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-300/20 dark:!bg-slate-950">
          <SummaryAmount label="Anchor product" value={productAnchor.bestDeal.price} />
          {typeof originalBudget === "number" ? (
            <div className="mt-3">
              <SummaryAmount label="Original budget" value={originalBudget} />
            </div>
          ) : null}
          {typeof remainingBudget === "number" ? (
            <div className="mt-3">
              <SummaryAmount label="Remaining" value={remainingBudget} highlight />
            </div>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 min-[425px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {sortedMatches.map((deal) => (
          <DealCard key={deal.id} deal={deal} onSelect={setSelectedDeal} />
        ))}
      </div>
    </section>
  );
}

function ProductQueryFallbackNotice({
  query,
  resultState,
  closestDeals,
  setSelectedDeal,
}: {
  query: string;
  resultState:
    | "not_applicable"
    | "exact"
    | "condition_mismatch"
    | "closest"
    | "none";
  closestDeals: EnrichedDeal[];
  setSelectedDeal: (deal: EnrichedDeal) => void;
}) {
  const hasClosestDeals = closestDeals.length > 0;
  const title =
    resultState === "condition_mismatch"
      ? `No ${query} matches for that condition`
      : `No exact matches for ${query}`;
  const body =
    resultState === "condition_mismatch"
      ? "I found the product, but not with the condition you selected. I will still show your category recommendations below."
      : "I could not find that exact product in the current catalog. I will still show recommendations from your selected categories below.";

  return (
    <section className="space-y-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-sm shadow-amber-950/5 dark:border-amber-300/20 dark:!bg-amber-300/10 dark:ring-1 dark:ring-amber-300/15 md:p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:!text-amber-200">
          Product check
        </p>
        <h2 className="mt-1 text-xl font-black text-gray-950 dark:!text-white">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-700 dark:!text-amber-50">
          {body}
        </p>
      </div>
      {hasClosestDeals ? (
        <div>
          <h3 className="text-sm font-black text-gray-950 dark:!text-white">
            Closest product matches
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-4 min-[425px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {closestDeals.slice(0, 4).map((deal) => (
              <DealCard key={deal.id} deal={deal} onSelect={setSelectedDeal} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function AddOnBudgetEmptyState({
  categories,
  remainingBudget,
  suggestedDeals,
  setSelectedDeal,
}: {
  categories: string[];
  remainingBudget?: number;
  suggestedDeals: EnrichedDeal[];
  setSelectedDeal: (deal: EnrichedDeal) => void;
}) {
  const categoryLabel = categories.join(", ") || "selected categories";
  const nearbyDeals = suggestedDeals
    .filter((deal) => categories.includes(deal.category))
    .slice(0, 4);
  const nearestDeal = nearbyDeals[0];
  const shortfall =
    nearestDeal && typeof remainingBudget === "number"
      ? Math.max(0, nearestDeal.bestDeal.price - remainingBudget)
      : 0;

  return (
    <div className="space-y-5">
      <EmptyRecommendations
        title={`No ${categoryLabel} fit within the remaining budget`}
        body={
          shortfall > 0 && nearestDeal
            ? `Your main product fits, but the closest ${nearestDeal.category.toLowerCase()} is ${formatUGX(shortfall)} above the remaining ${formatUGX(remainingBudget ?? 0)}.`
            : typeof remainingBudget === "number"
              ? `Your main product fits, but I could not fit ${categoryLabel} within the remaining ${formatUGX(remainingBudget)}.`
            : `Your main product fits, but I could not fit ${categoryLabel} with the remaining budget.`
        }
        onEditBrief={() => undefined}
        onBrowseDeals={() => undefined}
        showActions={false}
      />
      {nearbyDeals.length > 0 ? (
        <section className="rounded-3xl border border-emerald-900/10 bg-white/80 p-4 shadow-sm shadow-emerald-950/5 dark:border-white/15 dark:!bg-slate-900/90 dark:shadow-black/20 dark:ring-1 dark:ring-white/5 md:p-5">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700 dark:!text-emerald-300">
              Closest add-ons
            </p>
            <h2 className="mt-1 text-xl font-black text-gray-950 dark:!text-white">
              {categoryLabel} worth comparing
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600 dark:!text-slate-300">
              These exceed the remaining balance, but they are the closest
              options from your selected categories. Adjusting the budget may
              make one fit.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 min-[425px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {nearbyDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} onSelect={setSelectedDeal} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ProductAddOnResults({
  categories,
  deals,
  remainingBudget,
  suggestedDeals,
  setSelectedDeal,
}: {
  categories: string[];
  deals: EnrichedDeal[];
  remainingBudget?: number;
  suggestedDeals: EnrichedDeal[];
  setSelectedDeal: (deal: EnrichedDeal) => void;
}) {
  const categoryLabel = categories.join(", ") || "selected categories";
  const sortedDeals = [...deals].sort(
    (a, b) =>
      a.bestDeal.price - b.bestDeal.price ||
      b.discount - a.discount ||
      a.title.localeCompare(b.title),
  );

  if (sortedDeals.length === 0) {
    return (
      <AddOnBudgetEmptyState
        categories={categories}
        remainingBudget={remainingBudget}
        suggestedDeals={suggestedDeals}
        setSelectedDeal={setSelectedDeal}
      />
    );
  }

  return (
    <section className="rounded-3xl border border-emerald-900/10 bg-white/80 p-4 shadow-sm shadow-emerald-950/5 dark:border-white/15 dark:!bg-slate-900/90 dark:shadow-black/20 dark:ring-1 dark:ring-white/5 md:p-5">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-green-700 dark:!text-emerald-300">
          Add-ons in budget
        </p>
        <h2 className="mt-1 text-xl font-black text-gray-950 dark:!text-white">
          {categoryLabel} that fit the balance
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-600 dark:!text-slate-300">
          I found {sortedDeals.length}{" "}
          {sortedDeals.length === 1 ? "product" : "products"} that fit within
          the remaining {typeof remainingBudget === "number" ? formatUGX(remainingBudget) : "budget"}.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 min-[425px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {sortedDeals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onSelect={setSelectedDeal} />
        ))}
      </div>
    </section>
  );
}

function ProductBasketPlanningNote({
  anchor,
  categories,
  remainingBudget,
}: {
  anchor: EnrichedDeal;
  categories: string[];
  remainingBudget?: number;
}) {
  const categoryLabel = categories.join(" and ") || "the selected categories";
  const balanceText =
    typeof remainingBudget === "number" ? formatUGX(remainingBudget) : "the remaining budget";

  return (
    <section className="rounded-3xl border border-emerald-900/10 bg-emerald-50/90 p-4 shadow-sm shadow-emerald-950/5 dark:border-emerald-300/20 dark:!bg-[#fff8df] dark:!text-slate-950 dark:shadow-black/20 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-green-700 dark:!text-green-700">
            How Naki planned this
          </p>
          <h2 className="mt-1 text-lg font-black leading-tight text-gray-950 dark:!text-slate-950">
            I found your product first, then built baskets with the balance.
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-700 dark:!text-slate-700">
            I used the cheapest matching option, {anchor.title}, at{" "}
            <span className="font-black text-green-700 dark:!text-green-700">
              {formatUGX(anchor.bestDeal.price)}
            </span>
            . The {categoryLabel} baskets below are built from the remaining{" "}
            <span className="font-black text-green-700 dark:!text-green-700">
              {balanceText}
            </span>
            .
          </p>
        </div>
        <div className="shrink-0 rounded-2xl border border-emerald-900/10 bg-white/80 px-4 py-3 text-left shadow-sm dark:border-emerald-900/10 dark:!bg-white/70">
          <p className="text-[0.7rem] font-bold uppercase tracking-wide text-gray-500 dark:!text-slate-600">
            Basket budget
          </p>
          <p className="mt-1 text-xl font-black text-green-700 dark:!text-green-700">
            {balanceText}
          </p>
        </div>
      </div>
    </section>
  );
}

function ProductAddOnGroupedMatches({
  categories,
  deals,
  remainingBudget,
  setSelectedDeal,
  onEditBrief,
  onBrowseDeals,
}: {
  categories: string[];
  deals: EnrichedDeal[];
  remainingBudget?: number;
  setSelectedDeal: (deal: EnrichedDeal) => void;
  onEditBrief: () => void;
  onBrowseDeals: () => void;
}) {
  const sections = categories
    .map((category) => ({
      category,
      deals: deals
        .filter((deal) => deal.category === category)
        .sort(
          (a, b) =>
            a.bestDeal.price - b.bestDeal.price ||
            b.discount - a.discount ||
            a.title.localeCompare(b.title),
        ),
    }))
    .filter((section) => section.deals.length > 0);

  if (sections.length === 0) {
    return (
      <EmptyRecommendations
        title="No add-ons found"
        body="No add-on products fit within the remaining balance and current search."
        onEditBrief={onEditBrief}
        onBrowseDeals={onBrowseDeals}
        showActions={false}
      />
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <section
          key={section.category}
          className="rounded-3xl border border-emerald-900/10 bg-white/80 p-4 shadow-sm shadow-emerald-950/5 dark:border-white/15 dark:!bg-slate-900/90 dark:shadow-black/20 dark:ring-1 dark:ring-white/5 md:p-5"
        >
          <div className="mb-4">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-green-700 dark:!text-emerald-300">
              <ListChecks className="h-4 w-4" aria-hidden="true" />
              Fits the balance
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-950 dark:!text-white">
              {section.category}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:!text-slate-300">
              {section.deals.length}{" "}
              {section.deals.length === 1 ? "match" : "matches"} within{" "}
              {typeof remainingBudget === "number"
                ? formatUGX(remainingBudget)
                : "the remaining budget"}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 min-[425px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {section.deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onSelect={setSelectedDeal}
                showActionIcon={false}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ProductOnlyRecommendationList({
  query,
  deals,
  closestDeals,
  resultState,
  pagination,
  page,
  setSelectedDeal,
  onPageChange,
  onEditBrief,
  onBrowseDeals,
  onRequestProduct,
}: {
  query: string;
  deals: EnrichedDeal[];
  closestDeals: EnrichedDeal[];
  resultState:
    | "not_applicable"
    | "exact"
    | "condition_mismatch"
    | "closest"
    | "none";
  pagination: PaginationMeta;
  page: number;
  setSelectedDeal: (deal: EnrichedDeal) => void;
  onPageChange: (page: number) => void;
  onEditBrief: () => void;
  onBrowseDeals: () => void;
  onRequestProduct: () => void;
}) {
  const safePage = Math.min(Math.max(page, 1), pagination.pageCount);
  const sortedDeals = [...deals].sort(
    (a, b) =>
      a.bestDeal.price - b.bestDeal.price ||
      b.discount - a.discount ||
      a.title.localeCompare(b.title),
  );
  const sortedClosestDeals = [...closestDeals].sort(
    (a, b) =>
      a.bestDeal.price - b.bestDeal.price ||
      b.discount - a.discount ||
      a.title.localeCompare(b.title),
  );
  if (
    (resultState === "closest" || resultState === "condition_mismatch") &&
    sortedClosestDeals.length > 0
  ) {
    const isConditionMismatch = resultState === "condition_mismatch";

    return (
      <section className="space-y-5">
        <EmptyRecommendations
          title={
            isConditionMismatch
              ? `No ${query} matches for that condition`
              : `No exact matches for ${query}`
          }
          body={
            isConditionMismatch
              ? "I found the product, but not with the condition you selected. Here are the available options I can compare."
              : "I found nearby products that may still be worth comparing."
          }
          onEditBrief={onEditBrief}
          onBrowseDeals={onBrowseDeals}
          showActions={false}
        />
        <section className="rounded-3xl border border-emerald-900/10 bg-white/80 p-4 shadow-sm shadow-emerald-950/5 dark:border-white/15 dark:!bg-slate-900/90 dark:shadow-black/20 dark:ring-1 dark:ring-white/5 md:p-5">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700 dark:!text-emerald-300">
              Closest matches
            </p>
            <h2 className="mt-1 text-xl font-black text-gray-950 dark:!text-white">
                {isConditionMismatch
                  ? "Available options I found"
                  : "Similar products I found"}
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-600 dark:!text-slate-300">
                {isConditionMismatch
                  ? "These match the product name, but their listed condition is different from your preference."
                  : `These are not exact matches for ${query}, but they share useful product details.`}
              </p>
          </div>
          <div className="grid grid-cols-1 gap-4 min-[425px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {sortedClosestDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} onSelect={setSelectedDeal} />
            ))}
          </div>
        </section>
      </section>
    );
  }

  if (sortedDeals.length === 0) {
    return (
      <EmptyRecommendations
        title={`No matches for ${query}`}
        body="I could not find exact or nearby products in the current catalog."
        onEditBrief={onEditBrief}
        onBrowseDeals={onBrowseDeals}
      >
        <Button
          type="button"
          className="mt-3 cursor-pointer rounded-full bg-emerald-700 px-5 text-white hover:bg-emerald-600"
          onClick={onRequestProduct}
        >
          Request this product
        </Button>
      </EmptyRecommendations>
    );
  }

  return (
    <section className="rounded-3xl border border-emerald-900/10 bg-white/80 p-4 shadow-sm shadow-emerald-950/5 dark:border-white/15 dark:!bg-slate-900/90 dark:shadow-black/20 dark:ring-1 dark:ring-white/5 md:p-5">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-green-700 dark:!text-emerald-300">
          Best matches
        </p>
        <h2 className="mt-1 text-xl font-black text-gray-950 dark:!text-white">
          {query} options sorted by price
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-600 dark:!text-slate-300">
          I found {pagination.totalCount}{" "}
          {pagination.totalCount === 1 ? "product" : "products"} matching your
          condition preference.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 min-[425px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {sortedDeals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onSelect={setSelectedDeal} />
        ))}
      </div>
      <Pagination
        page={safePage}
        pageCount={pagination.pageCount}
        onPageChange={onPageChange}
      />
    </section>
  );
}

function RecommendationAllMatchesList({
  brief,
  deals,
  pagination,
  page,
  setSelectedDeal,
  onPageChange,
  onEditBrief,
  onBrowseDeals,
}: {
  brief: ShoppingBrief;
  deals: EnrichedDeal[];
  pagination: PaginationMeta;
  page: number;
  setSelectedDeal: (deal: EnrichedDeal) => void;
  onPageChange: (page: number) => void;
  onEditBrief: () => void;
  onBrowseDeals: () => void;
}) {
  const categorySections = getMatchingDealSections(deals, brief);
  const safePage = Math.min(Math.max(page, 1), pagination.pageCount);

  return categorySections.length > 0 ? (
    <div className="space-y-6">
      {categorySections.map((section) => (
        <section
          key={section.category}
          className="rounded-3xl border border-emerald-900/10 bg-white/80 p-4 shadow-sm shadow-emerald-950/5 md:p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-green-700">
                <ListChecks className="h-4 w-4" aria-hidden="true" />
                Full match list
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-950">
                {section.category}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {section.deals.length}{" "}
                {section.deals.length === 1 ? "match" : "matches"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 min-[425px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {section.deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onSelect={setSelectedDeal}
                showActionIcon={false}
              />
            ))}
          </div>
        </section>
      ))}
      <Pagination
        page={safePage}
        pageCount={pagination.pageCount}
        onPageChange={onPageChange}
      />
    </div>
  ) : (
    <EmptyRecommendations
      title="No matches found"
      body="No products match your current brief and search."
      onEditBrief={onEditBrief}
      onBrowseDeals={onBrowseDeals}
      showActions={false}
    />
  );
}

export function RecommendationMatchesPage({
  brief,
  matchingDeals,
  matchingDealsPagination,
  search,
  setSearch,
  isSidebarOpen,
  setIsSidebarOpen,
  selectedCategory,
  setSelectedCategory,
  visibleCategories,
  setSelectedDeal,
  onBackToRecommendations,
  onEditBrief,
  onBrowseDeals,
  onSearchSubmit,
  isLoading,
  page,
  onPageChange,
}: {
  brief: ShoppingBrief | null;
  matchingDeals: EnrichedDeal[];
  matchingDealsPagination: PaginationMeta;
  search: string;
  setSearch: (value: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  visibleCategories: CategoryItem[];
  setSelectedDeal: (deal: EnrichedDeal) => void;
  onBackToRecommendations: () => void;
  onEditBrief: () => void;
  onBrowseDeals: () => void;
  onSearchSubmit: (query: string) => void;
  isLoading: boolean;
  page: number;
  onPageChange: (page: number) => void;
}) {
  const visibleMatchingDeals = matchingDeals.filter((deal) =>
    matchesDealSearch(deal, search),
  );
  const categorySections = getMatchingDealSections(visibleMatchingDeals, brief);

  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#f7fee7_34%,#f9fafb_62%)] px-4 pb-4 text-gray-950 md:px-6 md:pb-6">
      <AppHeaderShell
        search={search}
        setSearch={setSearch}
        showMenuButton
        onMenuClick={() => setIsSidebarOpen(true)}
        onHomeClick={onBrowseDeals}
        maxWidthClass="max-w-7xl"
        resultCount={matchingDealsPagination.totalCount}
        onSearchSubmit={onSearchSubmit}
      />

      <div className="mx-auto max-w-7xl">
        <MobileOffcanvas
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSelectCategory={setSelectedCategory}
          selectedCategory={selectedCategory}
          categoriesToShow={visibleCategories}
        />

        <section className="mt-8 mb-6 rounded-[2rem] border border-emerald-900/10 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.2),transparent_30%),linear-gradient(145deg,#064e3b,#111827)] p-5 text-white shadow-xl shadow-emerald-950/10 md:mt-10 md:p-6">
          <Button
            type="button"
            variant="outline"
            className="mb-4 h-10 cursor-pointer rounded-full border-white/25 bg-white/10 px-4 text-white hover:bg-white/20 hover:text-white"
            onClick={onBackToRecommendations}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to recommendations
          </Button>
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-200">
                <ListChecks className="h-4 w-4" aria-hidden="true" />
                Full match list
              </p>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                All matching products in your budget
              </h1>
              {brief ? (
                <>
                  <BriefChips brief={brief} />
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80 md:text-base">
                    Products are grouped by your selected categories and filtered
                    by your budget and condition preferences.
                  </p>
                </>
              ) : (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80 md:text-base">
                  Create a shopping brief to see all matching products.
                </p>
              )}
            </div>
            {brief ? (
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <span className="inline-flex h-10 items-center rounded-full bg-white/10 px-4 text-sm font-bold text-emerald-50">
                  {matchingDealsPagination.totalCount}{" "}
                  {matchingDealsPagination.totalCount === 1 ? "product" : "products"}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 cursor-pointer rounded-full border-white/30 bg-white/10 px-4 text-white hover:bg-white/20 hover:text-white"
                  onClick={onEditBrief}
                >
                  Edit brief
                </Button>
              </div>
            ) : null}
          </div>
        </section>

        {isLoading ? (
          <LoadingState
            title="Loading matches"
            body="Naki is checking every product against your brief."
          />
        ) : !brief ? (
          <EmptyRecommendations
            title="No brief yet"
            body="Naki needs your budget, categories, and preferred condition before matches can be shown."
            onEditBrief={onEditBrief}
            onBrowseDeals={onBrowseDeals}
          />
        ) : categorySections.length > 0 ? (
          <div className="space-y-6">
            {categorySections.map((section) => (
              <section
                key={section.category}
                className="rounded-3xl border border-emerald-900/10 bg-white/80 p-4 shadow-sm shadow-emerald-950/5 md:p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-gray-950">
                      {section.category}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {section.deals.length}{" "}
                      {section.deals.length === 1 ? "match" : "matches"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 min-[425px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {section.deals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onSelect={setSelectedDeal}
                      showActionIcon={false}
                    />
                  ))}
                </div>
              </section>
            ))}
            <Pagination
              page={Math.min(Math.max(page, 1), matchingDealsPagination.pageCount)}
              pageCount={matchingDealsPagination.pageCount}
              onPageChange={onPageChange}
            />
          </div>
        ) : (
          <EmptyRecommendations
            title="No matches found"
            body="No products match your current brief and search."
            onEditBrief={onEditBrief}
            onBrowseDeals={onBrowseDeals}
          />
        )}
      </div>
    </div>
  );
}

function RecommendationFeedbackRequest({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="mt-6 rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm shadow-emerald-950/5 md:p-6">
      <div className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-center">
        <div className="flex items-start gap-3 md:contents">
          <div className="h-16 w-16 shrink-0 md:h-24 md:w-24">
            <img
              src={feedbackAvatar}
              alt="Naki asking for feedback"
              className="h-full w-full object-contain object-center"
            />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold text-green-700">
              Help me improve
            </p>
            <h2 className="mt-1 text-xl font-black leading-snug text-gray-950 md:text-2xl">
              Were my recommendations useful?
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Share a quick rating and note so we can make future baskets more
              helpful.
            </p>
          </div>
        </div>
        <Button
          type="button"
          className="h-11 cursor-pointer rounded-full bg-green-600 px-5 text-white hover:bg-green-700"
          onClick={onOpen}
        >
          Share feedback
        </Button>
      </div>
    </section>
  );
}

function RecommendationBasketView({
  basket,
  visibleItems,
  setSelectedDeal,
  onSelectBasketDeal,
  restoreBasketShopModalId,
  onBasketShopModalRestored,
}: {
  basket: RecommendationBasket;
  visibleItems: RecommendationMatch[];
  setSelectedDeal: (deal: EnrichedDeal) => void;
  onSelectBasketDeal: (basketId: number, deal: EnrichedDeal) => void;
  restoreBasketShopModalId: number | null;
  onBasketShopModalRestored: () => void;
}) {
  const posthog = usePostHog();
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [pendingSite, setPendingSite] = useState<{
    url: string;
    site: string;
  } | null>(null);
  const basketSavings = basket.items.reduce(
    (total, item) => total + getSavingsAmount(item.deal),
    0,
  );
  const handleOpenShopModal = () => {
    posthog.capture("basket_shop_opened", {
      basket_id: basket.id,
      product_count: basket.items.length,
      total: basket.total,
      balance: basket.balance,
      savings: basketSavings,
      complete: basket.complete,
    });
    setIsShopModalOpen(true);
  };
  const handleSiteClick = (deal: EnrichedDeal) => {
    if (!deal.bestDeal.url) return;

    posthog.capture("basket_site_clicked", {
      basket_id: basket.id,
      product_title: deal.title,
      product_id: deal.id,
      category: deal.category,
      site: deal.bestDeal.site,
      price: deal.bestDeal.price,
    });
    setPendingSite({
      url: deal.bestDeal.url,
      site: deal.bestDeal.site || "selected",
    });
  };
  const handleSelectDealFromBasket = (deal: EnrichedDeal) => {
    posthog.capture("basket_product_comparison_opened", {
      basket_id: basket.id,
      product_title: deal.title,
      product_id: deal.id,
      category: deal.category,
      price: deal.bestDeal.price,
      site: deal.bestDeal.site,
      source: "basket_shop_modal_product",
    });
    setIsShopModalOpen(false);
    onSelectBasketDeal(basket.id, deal);
  };
  const handleContinueToSite = () => {
    if (!pendingSite || typeof window === "undefined") return;
    window.location.href = pendingSite.url;
  };

  useEffect(() => {
    if (restoreBasketShopModalId !== basket.id) return;

    setIsShopModalOpen(true);
    onBasketShopModalRestored();
  }, [
    basket.id,
    onBasketShopModalRestored,
    restoreBasketShopModalId,
  ]);

  return (
    <>
      <section className="relative grid gap-4 rounded-3xl border border-emerald-900/10 bg-white/70 p-3 pt-5 shadow-sm shadow-emerald-950/5 lg:grid-cols-[1fr_20rem]">
        {basketSavings > 0 ? (
          <p className="absolute right-4 top-0 inline-flex -translate-y-1/2 rounded-full bg-red-500 px-3 py-1.5 text-xs font-black text-white shadow-md shadow-red-500/25">
            Saves you {formatUGX(basketSavings)}
          </p>
        ) : null}
        <div>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black text-gray-950">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <ShoppingBasket className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>Basket {basket.id}</span>
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                This combination fits within your total budget.
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2 text-right">
              <span className="text-xs font-medium text-gray-500">
                {basket.items.length} products
              </span>
            </div>
          </div>

          {visibleItems.length > 0 ? (
            <div className="space-y-3">
              {visibleItems.map((match) => (
                <RecommendationRow
                  key={match.deal.id}
                  match={match}
                  onSelect={setSelectedDeal}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
              No recommended products match your current search.
            </div>
          )}
        </div>

        <aside className="self-start rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-300/20 dark:!bg-slate-900">
          <h3 className="text-base font-black text-gray-950 dark:!text-white">Budget summary</h3>
          <div className="mt-4 space-y-3 text-sm">
            <SummaryAmount label="Products total" value={basket.total} />
            <SummaryAmount label="Balance" value={basket.balance} highlight />
            {basketSavings > 0 ? (
              <SummaryAmount
                label="Savings"
                value={basketSavings}
                highlight
              />
            ) : null}
          </div>

          {basket.complete ? (
            <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800 dark:!bg-emerald-400/10 dark:!text-emerald-200">
              This basket stays within budget and leaves you with a balance.
            </p>
          ) : (
            <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:!bg-amber-300/10 dark:!text-amber-100 dark:ring-1 dark:ring-amber-300/20">
              <p className="font-semibold">Some categories were not included.</p>
              <p className="mt-1">
                Missing: {basket.missingCategories.join(", ")}
              </p>
            </div>
          )}

          <Button
            type="button"
            className="mt-4 h-12 w-full cursor-pointer rounded-2xl bg-[linear-gradient(135deg,#facc15,#22c55e)] font-black text-gray-950 shadow-lg shadow-emerald-900/15 ring-1 ring-amber-200/70 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-900/20 focus-visible:ring-4 focus-visible:ring-amber-300/50"
            onClick={handleOpenShopModal}
          >
            <ShoppingBasket className="h-4 w-4" aria-hidden="true" />
            Shop basket
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </aside>
      </section>

      <BasketShopModal
        open={isShopModalOpen}
        basket={basket}
        savings={basketSavings}
        onClose={() => setIsShopModalOpen(false)}
        onSelectDeal={handleSelectDealFromBasket}
        onSiteClick={handleSiteClick}
      />
      <LeaveSiteModal
        open={!!pendingSite}
        siteName={pendingSite?.site || "selected"}
        onClose={() => setPendingSite(null)}
        onContinue={handleContinueToSite}
      />
    </>
  );
}

function BasketShopModal({
  open,
  basket,
  savings,
  onClose,
  onSelectDeal,
  onSiteClick,
}: {
  open: boolean;
  basket: RecommendationBasket;
  savings: number;
  onClose: () => void;
  onSelectDeal: (deal: EnrichedDeal) => void;
  onSiteClick: (deal: EnrichedDeal) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex min-h-dvh w-screen items-start justify-center overflow-y-auto bg-gray-950/60 p-3 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`basket-shop-title-${basket.id}`}
        className="my-3 w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-emerald-950/20 dark:border dark:border-white/10 dark:!bg-slate-950 dark:shadow-black/50 sm:my-6"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 dark:border-white/10 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-green-700 dark:!text-emerald-300">
              <ShoppingBasket className="h-4 w-4" aria-hidden="true" />
              Shopping plan
            </p>
            <h2
              id={`basket-shop-title-${basket.id}`}
              className="mt-1 text-2xl font-black text-gray-950 dark:!text-white"
            >
              Shop Basket {basket.id}
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600 dark:!text-slate-300">
              Use the best listed store for each product, then compare details
              before you leave PearlDeals.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:border-emerald-300/25 dark:!bg-slate-800 dark:!text-emerald-100 dark:shadow-sm dark:shadow-black/30 dark:ring-1 dark:ring-white/10 dark:hover:!bg-emerald-900/45 dark:hover:!text-white"
            aria-label="Close shop basket modal"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-3 border-b border-gray-200 bg-emerald-50/70 px-4 py-4 text-sm dark:border-white/10 dark:!bg-emerald-400/10 sm:grid-cols-3 sm:px-6">
          <SummaryTile label="Products total" value={formatUGX(basket.total)} />
          <SummaryTile label="Balance" value={formatUGX(basket.balance)} />
          <SummaryTile label="Savings" value={formatUGX(savings)} />
        </div>

        <div className="max-h-[65vh] space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
          {basket.items.map(({ deal }) => (
            <div
              role="button"
              tabIndex={0}
              key={deal.id}
              className="group/card grid cursor-pointer gap-3 rounded-2xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-emerald-200 hover:shadow-lg focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-500/30 focus-visible:outline-none dark:border-white/15 dark:!bg-slate-900 dark:shadow-black/20 dark:ring-1 dark:ring-white/5 dark:hover:border-emerald-300/35 dark:hover:ring-emerald-300/20 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-center"
              onClick={() => onSelectDeal(deal)}
              onKeyDown={(event) =>
                handleProductSurfaceKeyDown(event, () => onSelectDeal(deal))
              }
              aria-label={`View comparison for ${deal.title}`}
            >
              <div className="flex h-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-white to-emerald-50 dark:!bg-[linear-gradient(135deg,#fff7ed,#ffffff,#dcfce7)]">
                <img
                  src={deal.image || imageFallback}
                  alt={deal.title}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = imageFallback;
                  }}
                  className="h-full w-full p-2 object-contain dark:mix-blend-multiply"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-green-700 dark:!text-emerald-300">
                  {deal.category}
                </p>
                <h3 className="mt-1 text-base font-black leading-snug text-gray-950 dark:!text-white">
                  {deal.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:!text-slate-300">
                  <span className="inline-flex items-center gap-1">
                    <Store className="h-3.5 w-3.5" aria-hidden="true" />
                    {deal.bestDeal.site}
                  </span>
                  <span>{deal.bestDeal.status || "New"}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:min-w-44 sm:items-end">
                <p className="text-lg font-black text-green-700 dark:!text-emerald-300">
                  {formatUGX(deal.bestDeal.price)}
                </p>
                <div className="flex w-full flex-col gap-2 sm:w-auto">
                  {deal.bestDeal.url ? (
                    <Button
                      type="button"
                    className="h-10 w-full cursor-pointer rounded-full bg-emerald-700 px-4 font-bold text-white hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 sm:w-auto"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSiteClick(deal);
                      }}
                    >
                      Go to store
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled
                      className="h-10 w-full cursor-not-allowed rounded-full bg-gray-300 px-4 text-gray-500 sm:w-auto"
                      onClick={(event) => event.stopPropagation()}
                    >
                      No link
                    </Button>
                  )}
                  <span
                    className="inline-flex h-10 w-full items-center justify-center rounded-full border border-gray-200 bg-white px-4 font-bold text-gray-950 transition-colors group-hover/card:border-emerald-200 group-hover/card:text-emerald-700 dark:border-white/10 dark:!bg-slate-800 dark:!text-white dark:group-hover/card:border-emerald-300/30 dark:group-hover/card:!text-emerald-200 sm:w-auto"
                    aria-hidden="true"
                  >
                    View comparison
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm dark:border-emerald-300/20 dark:!bg-slate-900 dark:ring-1 dark:ring-white/5">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:!text-slate-300">
        {label}
      </p>
      <p className="mt-1 text-base font-black text-gray-950 dark:!text-white">{value}</p>
    </div>
  );
}

function RecommendationRow({
  match,
  onSelect,
}: {
  match: RecommendationMatch;
  onSelect: (deal: EnrichedDeal) => void;
}) {
  const posthog = usePostHog();
  const { deal, reasons } = match;
  const [areOtherStoresOpen, setAreOtherStoresOpen] = useState(false);
  const savingsAmount = getSavingsAmount(deal);
  const comparisonPrices = deal.prices
    .filter((price) => !isSamePriceEntry(price, deal.bestDeal))
    .sort((a, b) => a.price - b.price);
  const otherStoresId = `other-stores-${deal.id}`;
  const openComparison = () => {
    posthog.capture("product_opened", {
      product: deal.title,
      category: deal.category,
      source: "recommendation_row",
    });
    onSelect(deal);
  };

  return (
    <article
      role="button"
      tabIndex={0}
      className="group/card grid cursor-pointer gap-3 rounded-3xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-500/30 focus-visible:outline-none dark:border-white/15 dark:!bg-slate-900 dark:shadow-black/20 dark:ring-1 dark:ring-white/5 dark:hover:border-emerald-300/35 dark:hover:ring-emerald-300/20 sm:grid-cols-[7rem_minmax(0,1fr)_minmax(12rem,auto)] sm:items-center"
      onClick={openComparison}
      onKeyDown={(event) =>
        handleProductSurfaceKeyDown(event, openComparison)
      }
      aria-label={`Compare prices for ${deal.title}`}
    >
      <div className="flex h-28 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-white to-emerald-50 dark:!bg-[linear-gradient(135deg,#fff7ed,#ffffff,#dcfce7)]">
        <img
          src={deal.image || imageFallback}
          alt={deal.title}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = imageFallback;
          }}
          className="h-full w-full p-3 object-contain dark:mix-blend-multiply"
        />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[0.7rem] font-semibold text-gray-700">
            {deal.category}
          </span>
          {reasons.map((reason) => (
            <span
              key={reason}
              className="rounded-full bg-green-100 px-2.5 py-1 text-[0.7rem] font-semibold text-green-800"
            >
              {reason}
            </span>
          ))}
        </div>
        <h3 className="mt-2 text-base font-black leading-snug text-gray-950">
          {deal.title}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
          <span>Best at {deal.bestDeal.site}</span>
          {deal.bestDeal.status ? (
            <span>Condition: {deal.bestDeal.status}</span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:min-w-48 sm:items-end">
        <div className="sm:text-right">
          {savingsAmount > 0 ? (
            <p className="mb-2 inline-flex rounded-full bg-red-500 px-3 py-1.5 text-xs font-black text-white shadow-md shadow-red-500/25">
              Save {formatUGX(savingsAmount)}
            </p>
          ) : null}
          <p className="text-lg font-bold text-green-700 dark:!text-emerald-300">
            {formatUGX(deal.bestDeal.price)}
          </p>
        </div>
        {comparisonPrices.length > 0 ? (
          <div className="w-full rounded-2xl bg-gray-50 px-3 py-2 text-xs text-gray-600 sm:max-w-56">
            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-between gap-2 text-left font-bold text-gray-600"
              aria-expanded={areOtherStoresOpen}
              aria-controls={otherStoresId}
              onClick={(event) => {
                event.stopPropagation();
                setAreOtherStoresOpen((isOpen) => !isOpen);
              }}
            >
              <span>
                Other stores ({comparisonPrices.length})
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform ${
                  areOtherStoresOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            {areOtherStoresOpen ? (
              <div id={otherStoresId} className="mt-2 space-y-1.5">
                {comparisonPrices.map((price, index) => (
                  <div
                    key={`${deal.id}-${price.site}-${index}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-gray-700">
                        {price.site}
                      </span>
                      <span className="block truncate text-[0.68rem] text-gray-500">
                        {price.status || "New"}
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold text-gray-900">
                      {formatUGX(price.price)}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        <span
          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-gray-950 px-2.5 text-sm font-bold whitespace-nowrap text-white transition-colors group-hover/card:bg-emerald-700 dark:bg-emerald-700 dark:text-white dark:shadow-lg dark:shadow-emerald-950/25 dark:group-hover/card:bg-emerald-600 sm:w-auto"
          aria-hidden="true"
        >
          Compare prices
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </article>
  );
}

function isSamePriceEntry(price: PriceEntry, other: PriceEntry) {
  return (
    price.site === other.site &&
    price.price === other.price &&
    price.original === other.original &&
    (price.status ?? "") === (other.status ?? "") &&
    (price.url ?? "") === (other.url ?? "")
  );
}

function handleProductSurfaceKeyDown(
  event: KeyboardEvent<HTMLElement>,
  onOpen: () => void,
) {
  if (event.target !== event.currentTarget) return;
  if (event.key !== "Enter" && event.key !== " ") return;

  event.preventDefault();
  onOpen();
}

function SummaryAmount({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-600 dark:!text-slate-300">{label}</span>
      <span
        className={`font-bold ${
          highlight
            ? "text-green-700 dark:!text-emerald-300"
            : "text-gray-950 dark:!text-white"
        }`}
      >
        {formatUGX(value)}
      </span>
    </div>
  );
}

function SummaryChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[0.7rem] font-semibold text-emerald-800 dark:border-emerald-300/25 dark:!bg-emerald-400/10 dark:!text-emerald-200 min-[375px]:px-3 min-[375px]:text-xs">
      {label}
    </span>
  );
}

function EmptyRecommendations({
  title,
  body,
  onEditBrief,
  onBrowseDeals,
  showActions = true,
  children,
}: {
  title: string;
  body: string;
  onEditBrief: () => void;
  onBrowseDeals: () => void;
  showActions?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 text-center shadow-sm dark:border-white/15 dark:!bg-slate-900 dark:shadow-black/20 dark:ring-1 dark:ring-white/5">
      <h2 className="text-xl font-black text-gray-950 dark:!text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600 dark:!text-slate-300">
        {body}
      </p>
      {showActions ? (
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-full bg-gray-950 px-5 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:text-white dark:shadow-lg dark:shadow-emerald-950/25 dark:hover:bg-emerald-600"
            onClick={onEditBrief}
          >
            Edit brief
          </Button>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-full px-5 dark:border-emerald-300/30 dark:!bg-emerald-400/10 dark:!text-emerald-100 dark:shadow-sm dark:shadow-emerald-950/20 dark:hover:!bg-emerald-400/18 dark:hover:!text-white"
            onClick={onBrowseDeals}
          >
            Browse all deals
          </Button>
        </div>
      ) : null}
      {children}
    </div>
  );
}

function NoRecommendationMatches({
  brief,
  suggestedDeals,
  setSelectedDeal,
  onEditBrief,
  onBrowseDeals,
}: {
  brief: ShoppingBrief;
  suggestedDeals: EnrichedDeal[];
  setSelectedDeal: (deal: EnrichedDeal) => void;
  onEditBrief: () => void;
  onBrowseDeals: () => void;
}) {
  const [suggestionsPage, setSuggestionsPage] = useState(1);
  const { pageItems, pageCount, safePage } = paginateItems(
    suggestedDeals,
    suggestionsPage,
  );

  useEffect(() => {
    setSuggestionsPage(1);
  }, [suggestedDeals]);

  return (
    <div className="space-y-5">
      <EmptyRecommendations
        title="No matches found"
        body="Try editing your brief with a higher budget, fewer categories, or broader conditions."
        onEditBrief={onEditBrief}
        onBrowseDeals={onBrowseDeals}
      />

      {suggestedDeals.length > 0 ? (
        <section>
          <div className="mb-3">
            <h2 className="text-xl font-bold text-gray-950 dark:!text-white">
              You could also look into
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:!text-slate-300">
              These nearby products are not exact matches, but they may still be
              worth comparing.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 min-[425px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {pageItems.map((deal) => (
              <SuggestionCard
                key={deal.id}
                brief={brief}
                deal={deal}
                onSelect={setSelectedDeal}
              />
            ))}
            <Pagination
              page={safePage}
              pageCount={pageCount}
              onPageChange={setSuggestionsPage}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SingleCategoryRecommendationList({
  brief,
  deals,
  pagination,
  setSelectedDeal,
  onPageChange,
}: {
  brief: ShoppingBrief;
  deals: EnrichedDeal[];
  pagination: PaginationMeta;
  setSelectedDeal: (deal: EnrichedDeal) => void;
  onPageChange: (page: number) => void;
}) {
  const sortedDeals = [...deals].sort(
    (a, b) =>
      a.bestDeal.price - b.bestDeal.price ||
      b.discount - a.discount ||
      a.title.localeCompare(b.title),
  );
  const category = brief.categories[0] ?? "products";
  const safePage = Math.min(Math.max(pagination.page, 1), pagination.pageCount);

  return (
    <section className="rounded-3xl border border-emerald-900/10 bg-white/80 p-4 shadow-sm shadow-emerald-950/5 dark:border-white/15 dark:!bg-slate-900/90 dark:shadow-black/20 dark:ring-1 dark:ring-white/5 md:p-5">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-green-700 dark:!text-emerald-300">
          Best matches
        </p>
        <h2 className="mt-1 text-xl font-black text-gray-950 dark:!text-white">
          Recommended {category.toLowerCase()} in your budget
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-600 dark:!text-slate-300">
          I found {pagination.totalCount}{" "}
          {pagination.totalCount === 1 ? "product" : "products"} that match
          your brief.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 min-[425px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {sortedDeals.map((deal) => (
          <SuggestionCard
            key={deal.id}
            brief={brief}
            deal={deal}
            onSelect={setSelectedDeal}
          />
        ))}
        <Pagination
          page={safePage}
          pageCount={pagination.pageCount}
          onPageChange={onPageChange}
        />
      </div>
    </section>
  );
}

function SuggestionCard({
  brief,
  deal,
  onSelect,
}: {
  brief: ShoppingBrief;
  deal: EnrichedDeal;
  onSelect: (deal: EnrichedDeal) => void;
}) {
  const posthog = usePostHog();
  const condition = deal.bestDeal.status || "New";
  const priceMatches =
    typeof brief.budget === "number" && deal.bestDeal.price <= brief.budget;
  const categoryMatches = brief.categories.includes(deal.category);
  const conditionMatches =
    condition !== "New" &&
    (brief.conditions.includes("All") ||
      brief.conditions.some((selectedCondition) => selectedCondition === condition));
  const openComparison = () => {
    posthog.capture("product_opened", {
      product: deal.title,
      category: deal.category,
      source: "recommendation_suggestion_card",
    });
    onSelect(deal);
  };

  return (
    <button
      type="button"
      className="group/card flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-500/30 focus-visible:outline-none dark:border-white/15 dark:!bg-slate-900 dark:shadow-black/20 dark:ring-1 dark:ring-white/5 dark:hover:border-emerald-300/35 dark:hover:ring-emerald-300/20"
      onClick={openComparison}
      aria-label={`Compare prices for ${deal.title}`}
    >
      <div className="flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-white to-emerald-50 dark:!bg-[linear-gradient(135deg,#fff7ed,#ffffff,#dcfce7)]">
        <img
          src={deal.image || imageFallback}
          alt={deal.title}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = imageFallback;
          }}
          className="h-full w-full p-4 object-contain dark:mix-blend-multiply"
        />
      </div>

      <div className="flex flex-1 flex-col p-3 text-sm">
        <h3 className="text-base font-black leading-snug text-gray-950 dark:!text-white">
          {deal.title}
        </h3>
        <p className="mt-1 text-xs text-gray-500 dark:!text-slate-300">
          Best at {deal.bestDeal.site}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <AttributeChip
            label="Price"
            value={formatUGX(deal.bestDeal.price)}
            matches={priceMatches}
          />
          <AttributeChip
            label="Category"
            value={deal.category}
            matches={categoryMatches}
          />
          <AttributeChip
            label="Condition"
            value={condition}
            matches={conditionMatches}
          />
        </div>

        <div className="mt-auto pt-3">
          <span
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-gray-950 px-2.5 text-sm font-bold whitespace-nowrap text-white transition-colors group-hover/card:bg-emerald-700 dark:bg-emerald-700 dark:text-white dark:shadow-lg dark:shadow-emerald-950/25 dark:group-hover/card:bg-emerald-600"
            aria-hidden="true"
          >
            Compare prices
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </button>
  );
}

function AttributeChip({
  label,
  value,
  matches,
}: {
  label: string;
  value: string;
  matches: boolean;
}) {
  return (
    <span
      className={`inline-flex max-w-full flex-col rounded-xl border px-3 py-2 ${
        matches
          ? "border-green-200 bg-green-50 text-green-800 dark:border-emerald-300/25 dark:!bg-emerald-400/10 dark:!text-emerald-200"
          : "border-gray-200 bg-gray-50 text-gray-700 dark:border-white/10 dark:!bg-slate-800 dark:!text-slate-200"
      }`}
    >
      <span className="text-[0.65rem] font-semibold uppercase tracking-wide">
        {label}
      </span>
      <span className="break-words text-xs font-bold leading-5">{value}</span>
    </span>
  );
}

function filterMatchesBySearch(matches: RecommendationMatch[], search: string) {
  return matches.filter(({ deal }) => {
    return matchesDealSearch(deal, search);
  });
}

function getVisibleStoreCount(
  baskets: { visibleItems: RecommendationMatch[] }[],
) {
  return new Set(
    baskets.flatMap(({ visibleItems }) =>
      visibleItems.map((match) => match.deal.bestDeal.site),
    ),
  ).size;
}

function getVisibleStoreCountFromDeals(deals: EnrichedDeal[]) {
  return new Set(deals.map((deal) => deal.bestDeal.site)).size;
}

function getMatchingDealSections(
  deals: EnrichedDeal[],
  brief: ShoppingBrief | null,
) {
  if (!brief) {
    return [];
  }

  const sectionCategories =
    brief.categories.length > 0
      ? brief.categories
      : Array.from(new Set(deals.map((deal) => deal.category)));

  return sectionCategories
    .map((category) => ({
      category,
      deals: deals
        .filter((deal) => deal.category === category)
        .sort(
          (a, b) =>
            a.bestDeal.price - b.bestDeal.price ||
            b.discount - a.discount ||
            a.title.localeCompare(b.title),
        ),
    }))
    .filter((section) => section.deals.length > 0);
}

function BriefChips({ brief }: { brief: ShoppingBrief }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5 min-[375px]:mt-4 min-[375px]:gap-2">
      {typeof brief.budget === "number" ? (
        <SummaryChip
          label={formatUGX(brief.budget)}
        />
      ) : null}
      {brief.productQuery ? (
        <SummaryChip label={brief.productQuery} />
      ) : null}
      {brief.categories.map((category) => (
        <SummaryChip key={category} label={category} />
      ))}
      {brief.conditions.map((condition) => (
        <SummaryChip
          key={condition}
          label={condition === "All" ? "All conditions" : condition}
        />
      ))}
    </div>
  );
}
