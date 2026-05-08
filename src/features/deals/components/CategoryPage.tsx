import { usePostHog } from "@posthog/react";
import { ArrowLeft, ArrowRight, Grid2X2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeaderShell, MobileOffcanvas } from "./AppChrome";
import { DealCard } from "./DealViews";
import { FloatingNakiButton } from "./FloatingNakiButton";
import type { CategoryItem, EnrichedDeal } from "../types";

export function CategoryPage({
  search,
  setSearch,
  isSidebarOpen,
  setIsSidebarOpen,
  selectedCategory,
  setSelectedCategory,
  visibleCategories,
  filteredDeals,
  setSelectedDeal,
  onOpenNaki,
  onBrowseDeals,
  onSearchSubmit,
}: {
  search: string;
  setSearch: (value: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string | null) => void;
  visibleCategories: CategoryItem[];
  filteredDeals: EnrichedDeal[];
  setSelectedDeal: (deal: EnrichedDeal) => void;
  onOpenNaki: () => void;
  onBrowseDeals: () => void;
  onSearchSubmit: (query: string) => void;
}) {
  const posthog = usePostHog();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#f7fee7_34%,#f9fafb_62%)] px-4 pb-4 text-gray-950 md:px-6 md:pb-6">
      <AppHeaderShell
        search={search}
        setSearch={setSearch}
        showMenuButton
        onMenuClick={() => setIsSidebarOpen(true)}
        onHomeClick={onBrowseDeals}
        maxWidthClass="max-w-7xl"
        resultCount={filteredDeals.length}
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

        <FloatingNakiButton
          source="category_page"
          category={selectedCategory}
          title="Need better deals?"
          description={`Find the best ${selectedCategory} within your budget.`}
          badge="Budget match"
          onOpenNaki={onOpenNaki}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <aside className="mt-4 hidden self-start rounded-3xl border border-emerald-900/10 bg-white/80 p-4 shadow-sm shadow-emerald-950/5 backdrop-blur md:block">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Grid2X2 className="h-5 w-5" />
              </span>
              <h2 className="font-black">Categories</h2>
            </div>
            <div className="space-y-2">
              {visibleCategories.map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => {
                    posthog.capture("category_clicked", {
                      category: cat.name,
                      source: "sidebar",
                    });

                    setSelectedCategory(cat.name);
                  }}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl px-3 py-3 text-sm transition hover:bg-emerald-50 ${
                    selectedCategory === cat.name
                      ? "bg-emerald-50 font-bold text-emerald-700 ring-1 ring-emerald-200"
                      : "text-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    {cat.name}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          </aside>

          <div className="md:col-span-3">
            <section className="mt-4 mb-4 rounded-[1.75rem] border border-emerald-900/10 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.24),transparent_32%),linear-gradient(145deg,#064e3b,#111827)] p-5 text-white shadow-xl shadow-emerald-950/10 md:p-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className="mb-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-emerald-50 hover:bg-white/20"
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-200">
                    <Sparkles className="h-4 w-4" />
                    Curated comparisons
                  </p>
                  <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                    {selectedCategory}
                  </h1>
                </div>
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-emerald-50">
                  {filteredDeals.length} products found
                </span>
              </div>
            </section>

            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-gray-600">
                Compare best prices, conditions, and stores before you choose a
                deal.
              </p>
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
          </div>
        </div>
      </div>
    </div>
  );
}
