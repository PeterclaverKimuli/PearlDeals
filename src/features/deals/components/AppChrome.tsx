import React from "react";
import { usePostHog } from "@posthog/react";
import { Check, Menu, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { imageFallback } from "../data";
import type { CategoryItem } from "../types";

const defaultQuickSearches = ["Phones", "Computers", "TVs", "Under 500k"];

export function ProductImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="flex h-56 w-full items-center justify-center overflow-hidden rounded-t-2xl bg-gradient-to-br from-amber-50 via-white to-emerald-50">
      <img
        src={src || imageFallback}
        alt={alt}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = imageFallback;
        }}
        className="h-full w-full p-4 object-contain transition duration-300 hover:scale-105"
      />
    </div>
  );
}

export function AppHeader({
  search,
  setSearch,
  onMenuClick,
  onHomeClick,
  showMenuButton = false,
  resultCount,
  quickSearches = defaultQuickSearches,
  onSearchSubmit,
}: {
  search: string;
  setSearch: (value: string) => void;
  onMenuClick?: () => void;
  onHomeClick?: () => void;
  showMenuButton?: boolean;
  resultCount?: number;
  quickSearches?: string[];
  onSearchSubmit?: (query: string) => void;
}) {
  const posthog = usePostHog();
  const brandClasses = "flex items-center gap-2 text-3xl font-bold";
  const trimmedSearch = search.trim();

  const updateSearch = (value: string, source: "input" | "quick_chip") => {
    setSearch(value);

    if (source === "input" && value.length > 2) {
      posthog.capture("search_used", {
        query: value,
        source,
      });
    }
  };
  const submitSearch = (query: string, source: "submit" | "quick_chip") => {
    const nextQuery = query.trim();
    if (!nextQuery) return;

    posthog.capture("search_used", {
      query: nextQuery,
      source,
    });
    onSearchSubmit?.(nextQuery);
  };

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="relative flex w-full items-center justify-center md:justify-start">
        {showMenuButton && (
          <button
            type="button"
            onClick={onMenuClick}
            className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-2xl text-gray-700 md:hidden"
            aria-label="Open categories"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        )}

        {onHomeClick ? (
          <button
            type="button"
            onClick={onHomeClick}
            className={`${brandClasses} cursor-pointer`}
            aria-label="Go to PearlDeals home"
          >
            <BrandMark />
          </button>
        ) : (
          <h1 className={brandClasses}>
            <BrandMark />
          </h1>
        )}
      </div>

      <div className="w-full md:w-[30rem]">
        <form
          className="rounded-[1.35rem] bg-gradient-to-r from-amber-300 via-lime-200 to-emerald-500 p-0.5 shadow-lg shadow-emerald-950/10 transition focus-within:shadow-xl focus-within:shadow-amber-950/15"
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch(search, "submit");
          }}
        >
          <div className="rounded-[1.2rem] bg-white p-1.5 ring-1 ring-emerald-950/5">
            <div className="relative flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                <Search className="h-4 w-4" />
              </span>
              <Input
                value={search}
                onChange={(e) => updateSearch(e.target.value, "input")}
                placeholder="Search phones, laptops, stores..."
                className="h-10 min-w-0 flex-1 rounded-full border-0 bg-transparent px-0 pr-2 text-sm font-medium text-gray-950 placeholder:text-gray-500 focus-visible:ring-0"
              />
              {trimmedSearch && typeof resultCount === "number" ? (
                <span className="hidden shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900 min-[420px]:inline-flex">
                  {resultCount} matches
                </span>
              ) : null}
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-500 transition duration-200 hover:bg-gray-200 hover:text-gray-950 focus-visible:ring-3 focus-visible:ring-emerald-600/30"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            {trimmedSearch && typeof resultCount === "number" ? (
              <div className="mt-1 px-2 min-[420px]:hidden">
                <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
                  {resultCount} matches
                </span>
              </div>
            ) : null}
          </div>
        </form>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {quickSearches.map((quickSearch) => (
            <button
              key={quickSearch}
              type="button"
              onClick={() => {
                updateSearch(quickSearch, "quick_chip");
                submitSearch(quickSearch, "quick_chip");
              }}
              className={`h-7 cursor-pointer rounded-full border px-3 text-xs font-bold transition ${
                search === quickSearch
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-emerald-200 bg-white/80 text-emerald-800 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900"
              }`}
            >
              {quickSearch}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <>
      <span className="text-2xl" aria-hidden="true">
        {"\u{1F4B8}"}
      </span>
      <span className="inline-flex items-baseline gap-0">
        <span className="text-gray-900">Pearl</span>
        <span className="text-green-600">Deals</span>
      </span>
    </>
  );
}

export function AppHeaderShell({
  search,
  setSearch,
  onMenuClick,
  onHomeClick,
  showMenuButton = false,
  maxWidthClass,
  resultCount,
  quickSearches,
  onSearchSubmit,
}: {
  search: string;
  setSearch: (value: string) => void;
  onMenuClick?: () => void;
  onHomeClick?: () => void;
  showMenuButton?: boolean;
  maxWidthClass: string;
  resultCount?: number;
  quickSearches?: string[];
  onSearchSubmit?: (query: string) => void;
}) {
  return (
    <>
      <div className="fixed top-0 right-0 left-0 z-50 border-b border-emerald-950/10 bg-white/90 px-4 pt-2 pb-6 shadow-sm backdrop-blur md:px-6">
        <div className={`mx-auto ${maxWidthClass}`}>
          <AppHeader
            search={search}
            setSearch={setSearch}
            showMenuButton={showMenuButton}
            onMenuClick={onMenuClick}
            onHomeClick={onHomeClick}
            resultCount={resultCount}
            quickSearches={quickSearches}
            onSearchSubmit={onSearchSubmit}
          />
        </div>
      </div>
      <div aria-hidden="true" className="h-44 md:h-28" />
    </>
  );
}

export function ActionPopover({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-green-600 px-3 py-1 text-xs text-white opacity-0 shadow-md transition-all duration-200 group-hover:opacity-100">
      {label}
    </div>
  );
}

export function ShareToast({ message }: { message: string }) {
  return (
    <div className="fixed right-4 top-4 z-[70] animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="flex items-start gap-3 rounded-2xl border border-green-500 bg-green-600 px-4 py-3 shadow-xl">
        <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-green-600">
          <Check className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            Link ready to share
          </p>
          <p className="text-sm text-green-100">{message}</p>
        </div>
      </div>
    </div>
  );
}

export function ValueProp({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center md:items-start md:text-left">
      <div className="mb-3 text-2xl text-green-600">{icon}</div>
      <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
      <p className="text-sm leading-6 text-gray-500">{description}</p>
    </div>
  );
}

export function MobileOffcanvas({
  open,
  onClose,
  onSelectCategory,
  selectedCategory,
  categoriesToShow,
}: {
  open: boolean;
  onClose: () => void;
  onSelectCategory: (category: string | null) => void;
  selectedCategory: string | null;
  categoriesToShow: readonly CategoryItem[];
}) {
  const posthog = usePostHog();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      <div className="w-72 bg-white p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Categories</h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-xl"
            type="button"
            aria-label="Close categories"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          {categoriesToShow.map((cat) => (
            <div
              key={cat.name}
              onClick={() => {
                posthog.capture("category_clicked", {
                  category: cat.name,
                  source: "mobile_offcanvas",
                });
                onSelectCategory(cat.name);
                onClose();
              }}
              className={`flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 hover:bg-gray-100 ${selectedCategory === cat.name ? "bg-gray-100 font-medium text-green-600" : ""}`}
            >
              <span>{cat.name}</span>
              <span className="text-gray-400">›</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-black/30" onClick={onClose} />
    </div>
  );
}


