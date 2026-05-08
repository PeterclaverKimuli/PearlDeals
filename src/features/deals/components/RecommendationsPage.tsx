import { useState } from "react";
import feedbackAvatar from "@/assets/Feedback prompt.png";
import recommendationAvatar from "@/assets/Ready Prompt - transparent.png";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ShoppingBasket,
  Sparkles,
  Store,
} from "lucide-react";
import { imageFallback } from "../data";
import type {
  CategoryItem,
  EnrichedDeal,
  RecommendationBasket,
  RecommendationMatch,
  ShoppingBrief,
} from "../types";
import {
  formatUGX,
  getRecommendationBaskets,
  getRecommendationSuggestions,
} from "../utils";
import { matchesDealSearch } from "../search";
import { AppHeaderShell, MobileOffcanvas } from "./AppChrome";
import { RecommendationFeedbackModal } from "./Modals";

export function RecommendationsPage({
  brief,
  deals,
  search,
  setSearch,
  isSidebarOpen,
  setIsSidebarOpen,
  selectedCategory,
  setSelectedCategory,
  visibleCategories,
  setSelectedDeal,
  onEditBrief,
  onBrowseDeals,
  onSearchSubmit,
}: {
  brief: ShoppingBrief | null;
  deals: EnrichedDeal[];
  search: string;
  setSearch: (value: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  visibleCategories: CategoryItem[];
  setSelectedDeal: (deal: EnrichedDeal) => void;
  onEditBrief: () => void;
  onBrowseDeals: () => void;
  onSearchSubmit: (query: string) => void;
}) {
  const [isRecommendationFeedbackOpen, setIsRecommendationFeedbackOpen] =
    useState(false);
  const baskets = getRecommendationBaskets(deals, brief);
  const visibleBaskets = baskets
    .map((basket) => ({
      basket,
      visibleItems: filterMatchesBySearch(basket.items, search),
    }))
    .filter(({ visibleItems }) => visibleItems.length > 0);
  const visibleMatchCount = visibleBaskets.reduce(
    (total, { visibleItems }) => total + visibleItems.length,
    0,
  );
  const visibleStoreCount = getVisibleStoreCount(visibleBaskets);
  const hasVisibleRecommendations = visibleBaskets.length > 0;
  const suggestedDeals =
    brief && baskets.length === 0
      ? getRecommendationSuggestions(deals, brief)
      : [];

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

        <section className="mt-4 mb-6 overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.2),transparent_30%),linear-gradient(145deg,#064e3b,#111827)] p-5 text-white shadow-xl shadow-emerald-950/10 md:p-6">
          <div className="grid grid-cols-[4rem_1fr] items-center gap-3 min-[375px]:grid-cols-[5rem_1fr] min-[375px]:gap-4 md:grid-cols-[7.5rem_1fr] md:gap-5 lg:grid-cols-[8rem_1fr_auto]">
            <div className="flex shrink-0 items-center justify-center">
              <img
                src={recommendationAvatar}
                alt="Naki presenting recommendations"
                className="h-16 w-16 object-contain object-center drop-shadow-xl min-[375px]:h-20 min-[375px]:w-20 md:h-32 md:w-32"
              />
            </div>
            <div className="grid min-w-0 gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
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
              {hasVisibleRecommendations ? (
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer rounded-full border-white/30 bg-white/10 px-4 text-white hover:bg-white/20 hover:text-white"
                    onClick={onEditBrief}
                  >
                    Edit brief
                  </Button>
                  <Button
                    type="button"
                    className="cursor-pointer rounded-full bg-amber-300 px-4 font-bold text-gray-950 hover:bg-amber-200"
                    onClick={onBrowseDeals}
                  >
                    Browse all deals
                  </Button>
                </div>
              ) : null}
          </div>
          </div>

        </section>

        {!brief ? (
          <EmptyRecommendations
            title="No brief yet"
            body="Naki needs your budget, categories, and preferred condition before recommendations can be matched."
            onEditBrief={onEditBrief}
            onBrowseDeals={onBrowseDeals}
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
          </>
        ) : null}
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
}: {
  basket: RecommendationBasket;
  visibleItems: RecommendationMatch[];
  setSelectedDeal: (deal: EnrichedDeal) => void;
}) {
  return (
    <section className="grid gap-4 rounded-3xl border border-emerald-900/10 bg-white/70 p-3 shadow-sm shadow-emerald-950/5 lg:grid-cols-[1fr_20rem]">
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-gray-950">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <ShoppingBasket className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>Basket option {basket.id}</span>
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              This combination fits within your total budget.
            </p>
          </div>
          <span className="text-xs font-medium text-gray-500">
            {basket.items.length} products
          </span>
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

      <aside className="self-start rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <h3 className="text-base font-black text-gray-950">Budget summary</h3>
        <div className="mt-4 space-y-3 text-sm">
          <SummaryAmount label="Products total" value={basket.total} />
          <SummaryAmount label="Balance" value={basket.balance} highlight />
        </div>

        {basket.complete ? (
          <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            This basket stays within budget and leaves you with a balance.
          </p>
        ) : (
          <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Some categories were not included.</p>
            <p className="mt-1">
              Missing: {basket.missingCategories.join(", ")}
            </p>
          </div>
        )}
      </aside>
    </section>
  );
}

function RecommendationRow({
  match,
  onSelect,
}: {
  match: RecommendationMatch;
  onSelect: (deal: EnrichedDeal) => void;
}) {
  const { deal, reasons } = match;

  return (
    <article className="grid gap-3 rounded-3xl border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg sm:grid-cols-[7rem_1fr_auto] sm:items-center">
      <div className="flex h-28 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-white to-emerald-50">
        <img
          src={deal.image || imageFallback}
          alt={deal.title}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = imageFallback;
          }}
          className="h-full w-full p-3 object-contain"
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
        <p className="mt-1 text-xs text-gray-500">Best at {deal.bestDeal.site}</p>
        {deal.bestDeal.status ? (
          <p className="mt-0.5 text-xs text-gray-500">
            Condition: {deal.bestDeal.status}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 sm:min-w-32 sm:items-end">
        <p className="text-lg font-bold text-green-700">
          {formatUGX(deal.bestDeal.price)}
        </p>
        <Button
          type="button"
          className="w-full cursor-pointer rounded-full bg-gray-950 text-white hover:bg-emerald-700 sm:w-auto"
          onClick={() => onSelect(deal)}
        >
          View & Compare
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
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
      <span className="text-gray-600">{label}</span>
      <span
        className={`font-bold ${highlight ? "text-green-700" : "text-gray-950"}`}
      >
        {formatUGX(value)}
      </span>
    </div>
  );
}

function SummaryChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[0.7rem] font-semibold text-emerald-800 min-[375px]:px-3 min-[375px]:text-xs">
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
}: {
  title: string;
  body: string;
  onEditBrief: () => void;
  onBrowseDeals: () => void;
  showActions?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 text-center shadow-sm">
      <h2 className="text-xl font-black text-gray-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">
        {body}
      </p>
      {showActions ? (
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-full px-5"
            onClick={onEditBrief}
          >
            Edit brief
          </Button>
          <Button
            type="button"
            className="cursor-pointer rounded-full bg-gray-950 px-5 text-white hover:bg-emerald-700"
            onClick={onBrowseDeals}
          >
            Browse all deals
          </Button>
        </div>
      ) : null}
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
  return (
    <div className="space-y-5">
      <EmptyRecommendations
        title="No matches found"
        body="Try editing your brief with a higher budget, fewer categories, or broader conditions."
        onEditBrief={onEditBrief}
        onBrowseDeals={onBrowseDeals}
        showActions={false}
      />

      {suggestedDeals.length > 0 ? (
        <section>
          <div className="mb-3">
            <h2 className="text-xl font-bold text-gray-950">
              You could also look into
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              These nearby products are not exact matches, but they may still be
              worth comparing.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 min-[425px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {suggestedDeals.map((deal) => (
              <SuggestionCard
                key={deal.id}
                brief={brief}
                deal={deal}
                onSelect={setSelectedDeal}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
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
  const condition = deal.bestDeal.status || "Unknown";
  const priceMatches = deal.bestDeal.price <= brief.budget;
  const categoryMatches = brief.categories.includes(deal.category);
  const conditionMatches =
    condition !== "Unknown" &&
    (brief.conditions.includes("All") ||
      brief.conditions.some((selectedCondition) => selectedCondition === condition));

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl">
      <div className="flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-white to-emerald-50">
        <img
          src={deal.image || imageFallback}
          alt={deal.title}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = imageFallback;
          }}
          className="h-full w-full p-4 object-contain"
        />
      </div>

      <div className="flex flex-1 flex-col p-3 text-sm">
        <h3 className="text-base font-black leading-snug text-gray-950">
          {deal.title}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
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

        <div className="mt-auto pt-4">
          <Button
            type="button"
            className="w-full cursor-pointer rounded-full bg-gray-950 text-white hover:bg-emerald-700"
            onClick={() => onSelect(deal)}
          >
            View & Compare
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
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
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-gray-200 bg-gray-50 text-gray-700"
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

function BriefChips({ brief }: { brief: ShoppingBrief }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5 min-[375px]:mt-4 min-[375px]:gap-2">
      <SummaryChip label={formatUGX(brief.budget)} />
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
