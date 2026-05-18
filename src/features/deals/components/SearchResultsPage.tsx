import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CategoryItem, EnrichedDeal } from "../types";
import { AppHeaderShell, MobileOffcanvas } from "./AppChrome";
import { DealCard } from "./DealViews";
import { LoadingState } from "./LoadingState";
import { UnavailableProductModal } from "./Modals";
import { Pagination } from "./Pagination";

export function SearchResultsPage({
  search,
  setSearch,
  results,
  resultCount,
  isSidebarOpen,
  setIsSidebarOpen,
  visibleCategories,
  selectedCategory,
  setSelectedCategory,
  setSelectedDeal,
  onBrowseDeals,
  onSearchSubmit,
  isLoading,
  page,
  pageCount,
  onPageChange,
}: {
  search: string;
  setSearch: (value: string) => void;
  results: EnrichedDeal[];
  resultCount: number;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
  visibleCategories: CategoryItem[];
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  setSelectedDeal: (deal: EnrichedDeal) => void;
  onBrowseDeals: () => void;
  onSearchSubmit: (query: string) => void;
  isLoading: boolean;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  const query = search.trim();
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const [isUnavailableProductModalOpen, setIsUnavailableProductModalOpen] =
    useState(false);
  const [promptedSearchTerms, setPromptedSearchTerms] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    const normalizedQuery = query.toLowerCase();

    if (
      isLoading ||
      !normalizedQuery ||
      resultCount > 0 ||
      promptedSearchTerms.has(normalizedQuery)
    ) {
      return;
    }

    setPromptedSearchTerms((current) => new Set(current).add(normalizedQuery));
    setIsUnavailableProductModalOpen(true);
  }, [isLoading, promptedSearchTerms, query, resultCount]);

  const clearSearch = () => {
    setSearch("");
    onBrowseDeals();
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#f7fee7_34%,#f9fafb_62%)] px-4 pb-4 text-gray-950 md:px-6 md:pb-6">
      <AppHeaderShell
        search={search}
        setSearch={setSearch}
        showMenuButton
        onMenuClick={() => setIsSidebarOpen(true)}
        onHomeClick={onBrowseDeals}
        maxWidthClass="max-w-7xl"
        resultCount={resultCount}
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

        <section className="mt-8 mb-6 rounded-[1.75rem] border border-emerald-900/10 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.22),transparent_30%),linear-gradient(145deg,#064e3b,#111827)] p-5 text-white shadow-xl shadow-emerald-950/10 md:mt-10 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-200">
                <Search className="h-4 w-4" />
                Deal finder
              </p>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                {query ? `Search results for "${query}"` : "Search results"}
              </h1>
              <p className="mt-3 text-sm leading-6 text-emerald-50/80 md:text-base">
                Compare matching products across categories and stores.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex h-10 items-center rounded-full bg-white/10 px-4 text-sm font-bold text-emerald-50">
                {resultCount} {resultCount === 1 ? "product" : "products"} found
              </span>
              {query ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 cursor-pointer rounded-full border-white/30 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20 hover:text-white"
                  onClick={clearSearch}
                >
                  Clear search
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        {isLoading ? (
          <LoadingState
            title="Searching deals"
            body="Checking matching products across categories and stores."
          />
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 min-[425px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {results.map((deal) => (
              <DealCard key={deal.id} deal={deal} onSelect={setSelectedDeal} />
            ))}
            <Pagination
              page={safePage}
              pageCount={pageCount}
              onPageChange={onPageChange}
            />
          </div>
        ) : (
          <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
              <Search className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black text-gray-950">
              No products found
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">
              Try a category, product name, or store like Phones, HP, Jumia, or
              TVs.
            </p>
            <Button
              type="button"
              className="mt-5 cursor-pointer rounded-full bg-gray-950 px-5 text-white hover:bg-emerald-700"
              onClick={clearSearch}
            >
              Back to all deals
            </Button>
          </div>
        )}
        <UnavailableProductModal
          open={isUnavailableProductModalOpen}
          onClose={() => setIsUnavailableProductModalOpen(false)}
          searchQuery={query}
        />
      </div>
    </div>
  );
}
