import React from "react";
import { usePostHog } from "@posthog/react";
import { Search, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { imageFallback } from "../data";
import type { CategoryItem } from "../types";

export function ProductImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="flex h-56 w-full items-center justify-center overflow-hidden rounded-t-2xl bg-gray-100">
      <img
        src={src || imageFallback}
        alt={alt}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = imageFallback;
        }}
        className="h-full w-full bg-white p-4 object-contain transition duration-300 hover:scale-105"
      />
    </div>
  );
}

export function AppHeader({
  search,
  setSearch,
  onMenuClick,
  showMenuButton = false,
}: {
  search: string;
  setSearch: (value: string) => void;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}) {
  const posthog = usePostHog();

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative flex w-full items-center justify-center md:justify-start">
        {showMenuButton && (
          <button
            type="button"
            onClick={onMenuClick}
            className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-2xl text-gray-700 md:hidden"
            aria-label="Open categories"
          >
            ☰
          </button>
        )}

        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <span className="text-2xl">💸</span>
          <span className="inline-flex items-baseline gap-0">
            <span className="text-gray-900">Pearl</span>
            <span className="text-green-600">Deals</span>
          </span>
        </h1>
      </div>

      <div className="w-full md:w-96">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);

              if (value.length > 2) {
                posthog.capture("search_used", {
                  query: value,
                });
              }
            }}
            placeholder="Search deals..."
            className="h-11 pl-10 pr-10"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 transition duration-200 hover:scale-110 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AppHeaderShell({
  search,
  setSearch,
  onMenuClick,
  showMenuButton = false,
  maxWidthClass,
}: {
  search: string;
  setSearch: (value: string) => void;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  maxWidthClass: string;
}) {
  return (
    <>
      <div className="fixed top-0 right-0 left-0 z-50 border-b bg-gray-50 px-4 pt-2 pb-6 backdrop-blur md:px-6">
        <div className={`mx-auto ${maxWidthClass}`}>
          <AppHeader
            search={search}
            setSearch={setSearch}
            showMenuButton={showMenuButton}
            onMenuClick={onMenuClick}
          />
        </div>
      </div>
      <div aria-hidden="true" className="h-32 md:h-24" />
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
          >
            ×
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
