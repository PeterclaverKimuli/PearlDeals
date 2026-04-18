import { usePostHog } from "@posthog/react";
import { Button } from "@/components/ui/button";
import { AppHeaderShell, MobileOffcanvas } from "./AppChrome";
import { DealCard } from "./DealViews";
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
}) {
  const posthog = usePostHog();

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-4 md:px-6 md:pb-6">
      <AppHeaderShell
        search={search}
        setSearch={setSearch}
        showMenuButton
        onMenuClick={() => setIsSidebarOpen(true)}
        maxWidthClass="max-w-7xl"
      />

      <div className="mx-auto max-w-7xl">
        <MobileOffcanvas
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSelectCategory={setSelectedCategory}
          selectedCategory={selectedCategory}
          categoriesToShow={visibleCategories}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="mt-4 hidden self-start rounded-2xl bg-white p-4 shadow-sm md:block">
            <h2 className="mb-4 font-semibold">Categories</h2>
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
                  className={`flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 hover:bg-gray-100 ${selectedCategory === cat.name ? "bg-gray-100 font-medium text-green-600" : ""}`}
                >
                  <span>{cat.name}</span>
                  <span>›</span>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="mt-4 mb-4 flex items-center gap-4 rounded-2xl bg-gray-200 p-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className="cursor-pointer italic text-green-600 hover:text-green-700"
                type="button"
              >
                ← Back
              </button>
              <h1 className="text-3xl font-bold">{selectedCategory}</h1>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {filteredDeals.length} Products found
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
