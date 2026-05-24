import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  AlertTriangle,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  LockKeyhole,
  LogOut,
  Pencil,
  Plus,
  Search,
  Save,
  Power,
  PowerOff,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Store,
  Tags,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { imageFallback } from "../deals/data";
import { formatMerchantDisplayName } from "../deals/utils";
import type {
  AdminCreateProductOfferInput,
  AdminMerchantRow,
  AdminOfferRow,
  AdminProductRow,
  AdminScrapeProbeResult,
  AdminScrapeRunRow,
  AdminSimilarProduct,
  AdminSummary,
} from "../../../shared/admin/types";

type AdminSessionResponse = {
  authenticated: boolean;
  adminPath?: string;
};

type ProductsResponse = { products: AdminProductRow[] };
type OffersResponse = { offers: AdminOfferRow[] };
type MerchantsResponse = { merchants: AdminMerchantRow[] };
type ScrapeRunsResponse = { scrapeRuns: AdminScrapeRunRow[] };
type ScrapeProbeResponse = { probe: AdminScrapeProbeResult };
type DuplicateCheckResponse = { similarProducts: AdminSimilarProduct[] };
type CreateOfferDraft = AdminCreateProductOfferInput & {
  id?: number;
  probeUrl: string;
  probeStatus: string;
};

type AdminDashboardData = {
  summary: AdminSummary;
  products: AdminProductRow[];
  offers: AdminOfferRow[];
  merchants: AdminMerchantRow[];
  scrapeRuns: AdminScrapeRunRow[];
};

type AdminDashboardTab =
  | "products"
  | "merchants"
  | "offers"
  | "scrape-runs"
  | "scrape-probe";
type ProductTab = "list" | "add";
type ProductSortKey = "updated" | "title" | "category" | "visibility" | "offers";
type MerchantSortKey = "name" | "enabled" | "offers" | "failed";
type OfferSortKey = "updated" | "product" | "merchant" | "price" | "scrape";
type ScrapeRunSortKey = "started" | "status" | "failures" | "jobs";

const dashboardTabs: { id: AdminDashboardTab; label: string }[] = [
  { id: "products", label: "Products" },
  { id: "merchants", label: "Merchants" },
  { id: "offers", label: "Recent Offers" },
  { id: "scrape-runs", label: "Recent Scrape Runs" },
  { id: "scrape-probe", label: "Scrape Probe" },
];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected admin error";
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? `Request failed with ${response.status}`);
  }

  return payload;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPreviewMoney(value: number) {
  return `UGX ${formatMoney(value)}`;
}

function formatDate(value: string | null) {
  if (!value) return "Not yet";

  return new Date(value).toLocaleString();
}

function decodeHtmlEntities(value: string) {
  if (typeof window === "undefined") {
    return value
      .replace(/&quot;/g, '"')
      .replace(/&#34;/g, '"')
      .replace(/&#x22;/gi, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&");
  }

  const element = document.createElement("textarea");
  element.innerHTML = value;
  return element.value;
}

type StatusTone = "green" | "amber" | "red" | "blue" | "slate";

const statusToneClasses: Record<StatusTone, string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-rose-200 bg-rose-50 text-rose-700",
  blue: "border-sky-200 bg-sky-50 text-sky-700",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
};

const metricToneClasses: Record<StatusTone, { card: string; icon: string }> = {
  green: {
    card: "border-emerald-200 bg-emerald-50/70",
    icon: "border-emerald-200 bg-emerald-100 text-emerald-700",
  },
  amber: {
    card: "border-amber-200 bg-amber-50/70",
    icon: "border-amber-200 bg-amber-100 text-amber-700",
  },
  red: {
    card: "border-rose-200 bg-rose-50/70",
    icon: "border-rose-200 bg-rose-100 text-rose-700",
  },
  blue: {
    card: "border-sky-200 bg-sky-50/70",
    icon: "border-sky-200 bg-sky-100 text-sky-700",
  },
  slate: {
    card: "border-slate-200 bg-slate-50/70",
    icon: "border-slate-200 bg-slate-100 text-slate-700",
  },
};

function getStatusTone(value: string): StatusTone {
  const normalized = value.toLowerCase();

  if (
    normalized.includes("success") ||
    normalized.includes("visible") ||
    normalized.includes("enabled") ||
    normalized.includes("active")
  ) {
    return "green";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("warning") ||
    normalized.includes("not_listed") ||
    normalized.includes("not listed")
  ) {
    return "amber";
  }

  if (
    normalized.includes("failed") ||
    normalized.includes("hidden") ||
    normalized.includes("disabled") ||
    normalized.includes("error")
  ) {
    return "red";
  }

  if (normalized.includes("shown") || normalized.includes("partial")) {
    return "blue";
  }

  return "slate";
}

function StatusPill({ value, tone }: { value: string; tone?: StatusTone }) {
  const resolvedTone = tone ?? getStatusTone(value);
  const label = value.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${statusToneClasses[resolvedTone]}`}
    >
      {label}
    </span>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  tone = "slate",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone?: StatusTone;
}) {
  const toneClasses = metricToneClasses[tone];

  return (
    <div className={`rounded-lg border p-4 ${toneClasses.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <div className={`rounded-md border p-2 ${toneClasses.icon}`}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">{detail}</p>
    </div>
  );
}

function getPageCount(totalItems: number, pageSize: number) {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

function getPageItems<T>(items: T[], page: number, pageSize: number) {
  return items.slice((page - 1) * pageSize, page * pageSize);
}

function includesSearch(values: Array<string | number | null>, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return values.some((value) =>
    String(value ?? "").toLowerCase().includes(normalizedQuery),
  );
}

function compareText(left: string | null, right: string | null) {
  return (left ?? "").localeCompare(right ?? "");
}

function compareDateDesc(left: string | null, right: string | null) {
  return new Date(right ?? 0).getTime() - new Date(left ?? 0).getTime();
}

function FilterToolbar({
  search,
  searchLabel,
  sort,
  sortOptions,
  onSearchChange,
  onSortChange,
}: {
  search: string;
  searchLabel: string;
  sort: string;
  sortOptions: { value: string; label: string }[];
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
}) {
  return (
    <div className="mt-4 grid gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3 sm:grid-cols-[1fr_14rem]">
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Search
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchLabel}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Sort
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value)}
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function getHostname(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function createEmptyOfferDraft(): CreateOfferDraft {
  return {
    probeUrl: "",
    probeStatus: "Not checked",
    merchantName: "",
    price: 0,
    original: 0,
    url: "",
    status: "New",
    availability: "unknown",
  };
}

function ActionTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    placement: "top" | "bottom";
  } | null>(null);

  function showTooltip() {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const maxWidth = 260;
    const gutter = 12;
    const center = rect.left + rect.width / 2;
    const left = Math.min(
      Math.max(center, gutter + maxWidth / 2),
      window.innerWidth - gutter - maxWidth / 2,
    );
    const placement = rect.top > 56 ? "top" : "bottom";

    setPosition({
      left,
      top: placement === "top" ? rect.top - 8 : rect.bottom + 8,
      placement,
    });
  }

  function hideTooltip() {
    setPosition(null);
  }

  return (
    <span
      ref={triggerRef}
      className="inline-flex"
      onBlur={hideTooltip}
      onFocus={showTooltip}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      {position && typeof document !== "undefined"
        ? createPortal(
            <span
              className="pointer-events-none fixed z-50 max-w-[260px] -translate-x-1/2 rounded-md border border-slate-200 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
              style={{
                left: position.left,
                top: position.top,
                transform:
                  position.placement === "top"
                    ? "translate(-50%, -100%)"
                    : "translateX(-50%)",
              }}
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}

function PageControls({
  page,
  pageCount,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing {firstItem}-{lastItem} of {formatNumber(totalItems)}
      </p>
      <div className="flex items-center gap-2">
        <ActionTooltip label="Go to the previous page">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft aria-hidden="true" />
            Previous
          </Button>
        </ActionTooltip>
        <span className="min-w-16 text-center text-xs font-medium text-slate-500">
          {page} / {pageCount}
        </span>
        <ActionTooltip label="Go to the next page">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(pageCount, page + 1))}
            disabled={page >= pageCount}
          >
            Next
            <ChevronRight aria-hidden="true" />
          </Button>
        </ActionTooltip>
      </div>
    </div>
  );
}

function AdminProductCardPreview({
  title,
  category,
  image,
  offers,
}: {
  title: string;
  category: string;
  image: string;
  offers: CreateOfferDraft[];
}) {
  const previewTitle = title.trim() || "Untitled product";
  const previewCategory = category.trim() || "Uncategorized";
  const previewImage = image.trim() || imageFallback;
  const previewOffers = offers
    .map((offer) => ({
      site: formatMerchantDisplayName(
        (offer.merchantName || getHostname(offer.url)).trim(),
      ),
      price: Number(offer.price),
      original: Number(offer.original || offer.price),
      status: offer.status.trim() || "New",
    }))
    .filter((offer) => offer.site && Number.isInteger(offer.price) && offer.price > 0);
  const bestPrice =
    previewOffers.length > 0
      ? Math.min(...previewOffers.map((offer) => offer.price))
      : 0;
  const bestOffer =
    previewOffers.find((offer) => offer.price === bestPrice) ?? previewOffers[0];
  const savings =
    previewOffers.length > 0
      ? Math.max(...previewOffers.map((offer) => offer.price)) - bestPrice
      : 0;

  return (
    <aside className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-slate-900">Preview</h3>
        <p className="text-xs text-muted-foreground">
          Updates as product details and offer prices change.
        </p>
      </div>

      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white py-0 text-left text-sm shadow-sm">
        {previewOffers.length > 0 ? (
          <div className="absolute left-3 top-2 z-10 rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white shadow-lg">
            Save {formatPreviewMoney(savings)}
          </div>
        ) : null}

        <div className="flex h-56 w-full items-center justify-center overflow-hidden rounded-t-2xl bg-gradient-to-br from-amber-50 via-white to-emerald-50">
          <img
            src={previewImage}
            alt=""
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = imageFallback;
            }}
            className="h-full w-full px-4 pt-10 pb-4 object-contain"
          />
        </div>

        <div className="flex flex-grow flex-col p-3 text-sm">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <h2 className="line-clamp-2 min-w-0 flex-1 text-base font-black leading-tight text-gray-950 md:text-lg">
              {previewTitle}
            </h2>
          </div>

          <p className="mb-2 text-xs font-semibold text-emerald-700">
            {previewCategory}
          </p>

          {bestOffer ? (
            <>
              <div className="mb-3">
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xl font-black text-emerald-700">
                    {formatPreviewMoney(bestOffer.price)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Store className="h-3.5 w-3.5" aria-hidden="true" />
                    {bestOffer.site}
                  </span>
                  {bestOffer.status ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                      {bestOffer.status}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mb-3 space-y-2 rounded-2xl bg-gray-50 p-3">
                {previewOffers.map((offer, index) => (
                  <div
                    key={`${offer.site}-${index}`}
                    className="flex flex-wrap justify-between gap-2 text-sm"
                  >
                    <span className="flex items-center gap-1 text-gray-600">
                      <span>{offer.site}</span>
                      {offer.price === bestPrice ? (
                        <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                          Best
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={`break-words text-right text-xs md:text-sm ${
                        offer.price === bestPrice
                          ? "font-semibold text-green-700"
                          : ""
                      }`}
                    >
                      {formatPreviewMoney(offer.price)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="mb-3 rounded-2xl bg-gray-50 p-3 text-sm text-gray-600">
              Add offer prices to complete preview.
            </div>
          )}

          <div className="mt-auto pt-3">
            <span className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-gray-950 px-2.5 font-bold whitespace-nowrap text-white">
              Compare prices
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function AdminErrorModal({
  title,
  message,
  onClose,
}: {
  title: string;
  message: string;
  onClose: () => void;
}) {
  if (!message) return null;

  const duplicateMatch = message.match(
    /^(Similar product already exists|Product already exists):\s(.+?)\s\((.+)\)\.$/,
  );

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        aria-modal="true"
        className="w-full max-w-md rounded-lg border border-rose-200 bg-white p-5 text-left shadow-2xl"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-950">{title}</h2>
            {duplicateMatch ? (
              <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-700">
                <p>{duplicateMatch[1]}:</p>
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 font-semibold text-amber-950">
                  {duplicateMatch[2]}
                </p>
                <p className="text-xs text-slate-500">{duplicateMatch[3]}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm leading-6 text-slate-700">{message}</p>
            )}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            <X aria-hidden="true" />
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function AdminPage() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadSession() {
      setIsCheckingSession(true);
      const response = await fetch("/api/admin/session", {
        credentials: "include",
      });
      const payload = await readJson<AdminSessionResponse>(response);

      if (isCurrent) {
        setIsAuthenticated(payload.authenticated);
        setIsCheckingSession(false);
        if (payload.authenticated) {
          void loadDashboard();
        }
      }
    }

    loadSession().catch((error) => {
      if (isCurrent) {
        setMessage(getErrorMessage(error));
        setIsCheckingSession(false);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      const payload = await readJson<AdminSessionResponse>(response);

      setIsAuthenticated(payload.authenticated);
      setToken("");
      setMessage(payload.authenticated ? "Admin session active." : "");
      if (payload.authenticated) {
        await loadDashboard();
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function handleLogout() {
    setMessage("");
    await fetch("/api/admin/session", {
      method: "DELETE",
      credentials: "include",
    });
    setDashboard(null);
    setIsAuthenticated(false);
  }

  async function loadDashboard() {
    setMessage("");
    setIsDashboardLoading(true);

    try {
      const [summary, products, offers, merchants, scrapeRuns] =
        await Promise.all([
          fetch("/api/admin/summary", { credentials: "include" }).then(
            (response) => readJson<AdminSummary>(response),
          ),
          fetch("/api/admin/products", { credentials: "include" }).then(
            (response) => readJson<ProductsResponse>(response),
          ),
          fetch("/api/admin/offers", { credentials: "include" }).then(
            (response) => readJson<OffersResponse>(response),
          ),
          fetch("/api/admin/merchants", { credentials: "include" }).then(
            (response) => readJson<MerchantsResponse>(response),
          ),
          fetch("/api/admin/scrape-runs", { credentials: "include" }).then(
            (response) => readJson<ScrapeRunsResponse>(response),
          ),
        ]);

      setDashboard({
        summary,
        products: products.products,
        offers: offers.offers,
        merchants: merchants.merchants,
        scrapeRuns: scrapeRuns.scrapeRuns,
      });
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setIsDashboardLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-background to-emerald-50/40 px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-3 border-b border-sky-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">PearlDeals</p>
            <h1 className="text-2xl font-semibold tracking-normal">Admin</h1>
          </div>
          {isAuthenticated ? (
            <ActionTooltip label="End this admin session">
              <Button type="button" variant="outline" onClick={handleLogout}>
                <LogOut aria-hidden="true" />
                Sign out
              </Button>
            </ActionTooltip>
          ) : null}
        </header>

        {isCheckingSession ? (
          <section className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Checking admin session.</p>
          </section>
        ) : isAuthenticated ? (
          <section className="grid gap-5">
            <div className="flex flex-col gap-3 rounded-lg border border-sky-200 bg-white/90 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  className="mt-0.5 size-5 text-emerald-700"
                  aria-hidden="true"
                />
                <div>
                  <h2 className="text-lg font-medium">Admin dashboard</h2>
                  <p className="text-sm text-muted-foreground">
                    Read-only catalog, merchant, offer, and scrape health.
                  </p>
                </div>
              </div>
              <div>
                <ActionTooltip label="Reload the latest admin dashboard data">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={loadDashboard}
                    disabled={isDashboardLoading}
                  >
                    <RefreshCw aria-hidden="true" />
                    Refresh
                  </Button>
                </ActionTooltip>
              </div>
            </div>

            {dashboard ? (
              <AdminDashboard dashboard={dashboard} onRefresh={loadDashboard} />
            ) : (
              <div className="rounded-lg border border-border bg-muted/40 p-5">
                <p className="text-sm text-muted-foreground">
                  {isDashboardLoading
                    ? "Loading dashboard."
                    : "Dashboard data has not loaded yet."}
                </p>
              </div>
            )}
          </section>
        ) : (
          <section className="max-w-md rounded-lg border border-border bg-card p-5">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-0.5 size-5 text-foreground" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-medium">Admin sign in</h2>
                <p className="text-sm text-muted-foreground">
                  Enter the admin token to continue.
                </p>
              </div>
            </div>
            <form className="mt-5 grid gap-3" onSubmit={handleLogin}>
              <label className="grid gap-1.5 text-sm font-medium">
                Admin token
                <Input
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>
              <Button type="submit">
                <LockKeyhole aria-hidden="true" />
                Sign in
              </Button>
            </form>
          </section>
        )}

        {message ? (
          <p className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
            {message}
          </p>
        ) : null}
      </div>
    </main>
  );
}

function AdminDashboard({
  dashboard,
  onRefresh,
}: {
  dashboard: AdminDashboardData;
  onRefresh: () => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<AdminDashboardTab>("products");
  const [productTab, setProductTab] = useState<ProductTab>("list");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [probeUrl, setProbeUrl] = useState("");
  const [probeResult, setProbeResult] = useState<AdminScrapeProbeResult | null>(
    null,
  );
  const [isProbeLoading, setIsProbeLoading] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createCategory, setCreateCategory] = useState("");
  const [createImage, setCreateImage] = useState("");
  const [createOffers, setCreateOffers] = useState<CreateOfferDraft[]>(() => [
    createEmptyOfferDraft(),
    createEmptyOfferDraft(),
    createEmptyOfferDraft(),
  ]);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingOriginalTitle, setEditingOriginalTitle] = useState("");
  const [editingOriginalCategory, setEditingOriginalCategory] = useState("");
  const [pendingProbeIndex, setPendingProbeIndex] = useState<number | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [createProductMessage, setCreateProductMessage] = useState("");
  const [similarProducts, setSimilarProducts] = useState<AdminSimilarProduct[]>(
    [],
  );
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [merchantSearch, setMerchantSearch] = useState("");
  const [offerSearch, setOfferSearch] = useState("");
  const [scrapeRunSearch, setScrapeRunSearch] = useState("");
  const [productSort, setProductSort] = useState<ProductSortKey>("updated");
  const [merchantSort, setMerchantSort] = useState<MerchantSortKey>("name");
  const [offerSort, setOfferSort] = useState<OfferSortKey>("updated");
  const [scrapeRunSort, setScrapeRunSort] =
    useState<ScrapeRunSortKey>("started");
  const [productPage, setProductPage] = useState(1);
  const [merchantPage, setMerchantPage] = useState(1);
  const [offerPage, setOfferPage] = useState(1);
  const [scrapeRunPage, setScrapeRunPage] = useState(1);
  const productPageSize = 10;
  const merchantPageSize = 6;
  const offerPageSize = 10;
  const scrapeRunPageSize = 6;
  const categoryOptions = Array.from(
    new Set(
      dashboard.products
        .map((product) => product.category.trim())
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));
  const visibleCategoryOptions =
    createCategory && !categoryOptions.includes(createCategory)
      ? [...categoryOptions, createCategory].sort((left, right) =>
          left.localeCompare(right),
        )
      : categoryOptions;
  const filteredProducts = dashboard.products
    .filter((product) =>
      includesSearch(
        [
          product.id,
          product.title,
          product.category,
          product.visibility,
          product.offerCount,
        ],
        productSearch,
      ),
    )
    .sort((left, right) => {
      if (productSort === "title") return compareText(left.title, right.title);
      if (productSort === "category") {
        return compareText(left.category, right.category);
      }
      if (productSort === "visibility") {
        return compareText(left.visibility, right.visibility);
      }
      if (productSort === "offers") {
        return right.visibleOfferCount - left.visibleOfferCount;
      }
      return compareDateDesc(left.updatedAt, right.updatedAt);
    });
  const filteredMerchants = dashboard.merchants
    .filter((merchant) =>
      includesSearch(
        [
          merchant.id,
          merchant.name,
          merchant.slug,
          merchant.baseUrl,
          merchant.enabled ? "enabled" : "disabled",
          merchant.scrapeStrategy,
        ],
        merchantSearch,
      ),
    )
    .sort((left, right) => {
      if (merchantSort === "enabled") {
        return Number(right.enabled) - Number(left.enabled);
      }
      if (merchantSort === "offers") return right.offerCount - left.offerCount;
      if (merchantSort === "failed") {
        return right.failedOfferCount - left.failedOfferCount;
      }
      return compareText(left.name, right.name);
    });
  const filteredOffers = dashboard.offers
    .filter((offer) =>
      includesSearch(
        [
          offer.id,
          offer.productId,
          offer.productTitle,
          offer.merchantName,
          offer.site,
          offer.status,
          offer.availability,
          offer.scrapeStatus,
          offer.price,
        ],
        offerSearch,
      ),
    )
    .sort((left, right) => {
      if (offerSort === "product") {
        return compareText(left.productTitle, right.productTitle);
      }
      if (offerSort === "merchant") {
        return compareText(
          left.merchantName ?? left.site,
          right.merchantName ?? right.site,
        );
      }
      if (offerSort === "price") return left.price - right.price;
      if (offerSort === "scrape") {
        return compareText(left.scrapeStatus, right.scrapeStatus);
      }
      return compareDateDesc(left.updatedAt, right.updatedAt);
    });
  const filteredScrapeRuns = dashboard.scrapeRuns
    .filter((run) =>
      includesSearch(
        [
          run.id,
          run.status,
          run.totalJobs,
          run.successCount,
          run.failureCount,
        ],
        scrapeRunSearch,
      ),
    )
    .sort((left, right) => {
      if (scrapeRunSort === "status") {
        return compareText(left.status, right.status);
      }
      if (scrapeRunSort === "failures") {
        return right.failureCount - left.failureCount;
      }
      if (scrapeRunSort === "jobs") return right.totalJobs - left.totalJobs;
      return compareDateDesc(left.startedAt, right.startedAt);
    });
  const productPageCount = getPageCount(
    filteredProducts.length,
    productPageSize,
  );
  const merchantPageCount = getPageCount(
    filteredMerchants.length,
    merchantPageSize,
  );
  const offerPageCount = getPageCount(filteredOffers.length, offerPageSize);
  const scrapeRunPageCount = getPageCount(
    filteredScrapeRuns.length,
    scrapeRunPageSize,
  );
  const pagedProducts = getPageItems(
    filteredProducts,
    productPage,
    productPageSize,
  );
  const pagedMerchants = getPageItems(
    filteredMerchants,
    merchantPage,
    merchantPageSize,
  );
  const pagedOffers = getPageItems(filteredOffers, offerPage, offerPageSize);
  const pagedScrapeRuns = getPageItems(
    filteredScrapeRuns,
    scrapeRunPage,
    scrapeRunPageSize,
  );

  useEffect(() => {
    setProductPage(1);
  }, [productSearch, productSort]);

  useEffect(() => {
    setMerchantPage(1);
  }, [merchantSearch, merchantSort]);

  useEffect(() => {
    setOfferPage(1);
  }, [offerSearch, offerSort]);

  useEffect(() => {
    setScrapeRunPage(1);
  }, [scrapeRunSearch, scrapeRunSort]);

  useEffect(() => {
    const title = createTitle.trim();
    const category = createCategory.trim();
    const isEditing = editingProductId !== null;
    const titleOrCategoryChanged =
      !isEditing ||
      title !== editingOriginalTitle.trim() ||
      category !== editingOriginalCategory.trim();

    if (
      activeTab !== "products" ||
      productTab !== "add" ||
      title.length < 4 ||
      !titleOrCategoryChanged
    ) {
      setSimilarProducts([]);
      setIsCheckingDuplicates(false);
      return;
    }

    let isCurrent = true;
    setIsCheckingDuplicates(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/admin/products/check-duplicate", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            category,
            excludeProductId: editingProductId ?? undefined,
          }),
        });
        const payload = await readJson<DuplicateCheckResponse>(response);
        if (isCurrent) setSimilarProducts(payload.similarProducts);
      } catch {
        if (isCurrent) setSimilarProducts([]);
      } finally {
        if (isCurrent) setIsCheckingDuplicates(false);
      }
    }, 900);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
    };
  }, [
    activeTab,
    productTab,
    createTitle,
    createCategory,
    editingProductId,
    editingOriginalTitle,
    editingOriginalCategory,
  ]);

  async function runAdminAction({
    actionKey,
    url,
    body,
    prompt,
  }: {
    actionKey: string;
    url: string;
    body: Record<string, unknown>;
    prompt: string;
  }) {
    if (!window.confirm(prompt)) return;

    setPendingAction(actionKey);

    try {
      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      await readJson<unknown>(response);
      await onRefresh();
    } catch (error) {
      window.alert(getErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function runScrapeProbe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsProbeLoading(true);
    setProbeResult(null);

    try {
      const response = await fetch("/api/admin/scrape-probe", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: probeUrl }),
      });
      const payload = await readJson<ScrapeProbeResponse>(response);
      setProbeResult(payload.probe);
    } catch (error) {
      window.alert(getErrorMessage(error));
    } finally {
      setIsProbeLoading(false);
    }
  }

  function updateCreateOffer(index: number, patch: Partial<CreateOfferDraft>) {
    setCreateOffers((offers) =>
      offers.map((offer, offerIndex) =>
        offerIndex === index ? { ...offer, ...patch } : offer,
      ),
    );
  }

  function resetProductForm() {
    setEditingProductId(null);
    setEditingOriginalTitle("");
    setEditingOriginalCategory("");
    setCreateTitle("");
    setCreateCategory("");
    setCreateImage("");
    setCreateOffers([
      createEmptyOfferDraft(),
      createEmptyOfferDraft(),
      createEmptyOfferDraft(),
    ]);
    setCreateProductMessage("");
    setSimilarProducts([]);
  }

  function editProduct(product: AdminProductRow) {
    const productOffers = dashboard.offers
      .filter((offer) => offer.productId === product.id)
      .map((offer): CreateOfferDraft => ({
        id: offer.id,
        probeUrl: offer.url ?? "",
        probeStatus: "Loaded from catalog",
        merchantName: offer.merchantName ?? offer.site,
        price: offer.price,
        original: offer.original,
        url: offer.url ?? "",
        status: offer.status || "New",
        availability: offer.availability || "unknown",
      }));
    const paddedOffers = [...productOffers];
    while (paddedOffers.length < 3) {
      paddedOffers.push(createEmptyOfferDraft());
    }

    setEditingProductId(product.id);
    setEditingOriginalTitle(product.title);
    setEditingOriginalCategory(product.category);
    setCreateTitle(product.title);
    setCreateCategory(product.category);
    setCreateImage(product.image);
    setCreateOffers(paddedOffers);
    setCreateProductMessage("");
    setSimilarProducts([]);
    setActiveTab("products");
    setProductTab("add");
  }

  async function probeCreateOffer(index: number) {
    const offer = createOffers[index];
    if (!offer.probeUrl.trim()) return;

    setPendingProbeIndex(index);

    try {
      const response = await fetch("/api/admin/scrape-probe", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: offer.probeUrl }),
      });
      const payload = await readJson<ScrapeProbeResponse>(response);
      const probe = payload.probe;

      if (!probe.scrapeable) {
        updateCreateOffer(index, {
          probeStatus: probe.errors.join(" ") || "Probe failed",
        });
        return;
      }

      if (!createTitle && probe.title) setCreateTitle(decodeHtmlEntities(probe.title));
      if (!createImage && probe.image) setCreateImage(probe.image);

      updateCreateOffer(index, {
        probeStatus: "Scrapeable",
        merchantName: probe.merchantCandidate ?? getHostname(probe.url),
        price: probe.price ?? 0,
        original: probe.original ?? probe.price ?? 0,
        url: probe.canonicalUrl ?? probe.url,
        status: probe.status ?? "New",
        availability: probe.availability ?? "unknown",
      });
    } catch (error) {
      updateCreateOffer(index, {
        probeStatus: getErrorMessage(error),
      });
    } finally {
      setPendingProbeIndex(null);
    }
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreatingProduct(true);
    setCreateProductMessage("");

    const isEditing = editingProductId !== null;

    try {
      const response = await fetch(
        isEditing
          ? `/api/admin/products/${editingProductId}/update`
          : "/api/admin/products",
        {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirm: isEditing ? "update-product" : "create-product",
          title: createTitle,
          category: createCategory,
          image: createImage,
          offers: createOffers.map(
            ({ id, merchantName, price, original, url, status, availability }) => ({
              id,
              merchantName,
              price,
              original,
              url,
              status,
              availability,
            }),
          ),
        }),
        },
      );

      await readJson<unknown>(response);
      window.alert(isEditing ? "Product updated." : "Product created.");
      resetProductForm();
      await onRefresh();
      setActiveTab("products");
      setProductTab("list");
    } catch (error) {
      setCreateProductMessage(getErrorMessage(error));
    } finally {
      setIsCreatingProduct(false);
    }
  }

  function addCreateOffer() {
    setCreateOffers((offers) => [...offers, createEmptyOfferDraft()]);
  }

  function removeCreateOffer(index: number) {
    setCreateOffers((offers) => {
      if (offers.length <= 3) return offers;

      return offers.filter((_, offerIndex) => offerIndex !== index);
    });
  }

  return (
    <div className="grid gap-5">
      <AdminErrorModal
        title={editingProductId ? "Product update failed" : "Product creation failed"}
        message={createProductMessage}
        onClose={() => setCreateProductMessage("")}
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Boxes className="size-4" aria-hidden="true" />}
          label="Products"
          value={formatNumber(dashboard.summary.products.total)}
          detail={`${formatNumber(dashboard.summary.products.visible)} visible, ${formatNumber(dashboard.summary.products.hidden)} hidden, ${formatNumber(dashboard.summary.products.notListed)} not listed`}
          tone="blue"
        />
        <MetricCard
          icon={<Tags className="size-4" aria-hidden="true" />}
          label="Offers"
          value={formatNumber(dashboard.summary.offers.total)}
          detail={`${formatNumber(dashboard.summary.offers.visible)} visible, ${formatNumber(dashboard.summary.offers.failed)} failed`}
          tone={dashboard.summary.offers.failed > 0 ? "amber" : "green"}
        />
        <MetricCard
          icon={<Store className="size-4" aria-hidden="true" />}
          label="Merchants"
          value={formatNumber(dashboard.summary.merchants.total)}
          detail={`${formatNumber(dashboard.summary.merchants.enabled)} enabled, ${formatNumber(dashboard.summary.merchants.disabled)} disabled`}
          tone="green"
        />
        <MetricCard
          icon={<Activity className="size-4" aria-hidden="true" />}
          label="Scrape runs"
          value={formatNumber(dashboard.summary.scrapeRuns.total)}
          detail={`Latest: ${dashboard.summary.scrapeRuns.latestStatus ?? "none"}`}
          tone={getStatusTone(dashboard.summary.scrapeRuns.latestStatus ?? "none")}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white/80 p-2 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {dashboardTabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-sky-300 bg-sky-100 text-sky-900"
                    : "border-transparent bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === "products" ? (
        <section className="rounded-lg border border-sky-200 bg-white/95 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-medium">Products</h2>
            <StatusPill value={`${formatNumber(filteredProducts.length)} shown`} />
          </div>
          <div className="mt-4 grid gap-2 rounded-lg border border-sky-100 bg-sky-50/60 p-2 sm:w-fit sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setProductTab("list")}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                productTab === "list"
                  ? "border-sky-300 bg-white text-sky-900"
                  : "border-transparent text-slate-600 hover:bg-white/70 hover:text-slate-900"
              }`}
            >
              Product List
            </button>
            <button
              type="button"
              onClick={() => {
                resetProductForm();
                setProductTab("add");
              }}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                productTab === "add"
                  ? "border-sky-300 bg-white text-sky-900"
                  : "border-transparent text-slate-600 hover:bg-white/70 hover:text-slate-900"
              }`}
            >
              Add/Edit Product
            </button>
          </div>
          {productTab === "list" ? (
            <>
          <FilterToolbar
            search={productSearch}
            searchLabel="Search title, category, ID, visibility"
            sort={productSort}
            sortOptions={[
              { value: "updated", label: "Recently updated" },
              { value: "title", label: "Title A-Z" },
              { value: "category", label: "Category A-Z" },
              { value: "visibility", label: "Visibility" },
              { value: "offers", label: "Visible offers" },
            ]}
            onSearchChange={setProductSearch}
            onSortChange={(value) => setProductSort(value as ProductSortKey)}
          />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-sky-100 bg-sky-50/60 text-xs text-sky-800">
                <tr>
                  <th className="py-2 pr-3 font-medium">Image</th>
                  <th className="py-2 pr-3 font-medium">Product</th>
                  <th className="py-2 pr-3 font-medium">Category</th>
                  <th className="py-2 pr-3 font-medium">Visibility</th>
                  <th className="py-2 pr-3 font-medium">Offers</th>
                  <th className="py-2 pr-3 font-medium">Updated</th>
                  <th className="py-2 pr-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="py-3 pr-3">
                      <div className="h-14 w-14 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-slate-400">
                            No image
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="max-w-[18rem] py-3 pr-3">
                      <p className="max-w-[18rem] whitespace-normal break-words font-medium leading-snug">
                        {product.title}
                      </p>
                      <p className="text-xs text-muted-foreground">ID {product.id}</p>
                    </td>
                    <td className="py-3 pr-3">{product.category}</td>
                    <td className="py-3 pr-3">
                      <StatusPill value={product.visibility} />
                    </td>
                    <td className="py-3 pr-3">
                      {product.visibleOfferCount}/{product.offerCount}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {formatDate(product.updatedAt)}
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <ActionTooltip label="Edit this product and its offers">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => editProduct(product)}
                          >
                            <Pencil aria-hidden="true" />
                            Edit
                          </Button>
                        </ActionTooltip>
                        <ActionTooltip
                          label={
                            product.visibility === "hidden"
                              ? "Make this product eligible for the public catalog"
                              : "Hide this product from the public catalog"
                          }
                        >
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              product.visibility === "hidden"
                                ? "outline"
                                : "destructive"
                            }
                            disabled={pendingAction === `product:${product.id}`}
                            onClick={() =>
                              runAdminAction({
                                actionKey: `product:${product.id}`,
                                url: `/api/admin/products/${product.id}/${
                                  product.visibility === "hidden"
                                    ? "unhide"
                                    : "hide"
                                }`,
                                body: {
                                  confirm:
                                    product.visibility === "hidden"
                                      ? "unhide-product"
                                      : "hide-product",
                                },
                                prompt:
                                  product.visibility === "hidden"
                                    ? `Unhide product ${product.id}? It will only appear publicly if it has a visible offer.`
                                    : `Hide product ${product.id} from the public catalog?`,
                              })
                            }
                          >
                            {product.visibility === "hidden" ? (
                              <Eye aria-hidden="true" />
                            ) : (
                              <EyeOff aria-hidden="true" />
                            )}
                            {product.visibility === "hidden" ? "Unhide" : "Hide"}
                          </Button>
                        </ActionTooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PageControls
            page={productPage}
            pageCount={productPageCount}
            totalItems={filteredProducts.length}
            pageSize={productPageSize}
            onPageChange={setProductPage}
          />
            </>
          ) : null}
        </section>
      ) : null}

      {activeTab === "merchants" ? (
        <section className="rounded-lg border border-emerald-200 bg-white/95 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-medium">Merchants</h2>
            <StatusPill value={`${formatNumber(filteredMerchants.length)} shown`} />
          </div>
          <FilterToolbar
            search={merchantSearch}
            searchLabel="Search name, slug, URL, status"
            sort={merchantSort}
            sortOptions={[
              { value: "name", label: "Name A-Z" },
              { value: "enabled", label: "Enabled first" },
              { value: "offers", label: "Most offers" },
              { value: "failed", label: "Most failed offers" },
            ]}
            onSearchChange={setMerchantSearch}
            onSortChange={(value) => setMerchantSort(value as MerchantSortKey)}
          />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-emerald-100 bg-emerald-50/60 text-xs text-emerald-900">
                <tr>
                  <th className="py-2 pr-3 font-medium">Merchant</th>
                  <th className="py-2 pr-3 font-medium">Base URL</th>
                  <th className="py-2 pr-3 font-medium">Offers</th>
                  <th className="py-2 pr-3 font-medium">Failed</th>
                  <th className="py-2 pr-3 font-medium">Scraping</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedMerchants.map((merchant) => (
                  <tr key={merchant.id}>
                    <td className="max-w-[16rem] py-3 pr-3">
                      <p className="truncate font-medium">{merchant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {merchant.slug}
                      </p>
                    </td>
                    <td className="max-w-[18rem] py-3 pr-3">
                      <p className="truncate text-muted-foreground">
                        {merchant.baseUrl ?? "Not set"}
                      </p>
                    </td>
                    <td className="py-3 pr-3">{merchant.offerCount}</td>
                    <td className="py-3 pr-3">{merchant.failedOfferCount}</td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill
                          value={merchant.enabled ? "enabled" : "disabled"}
                        />
                        <ActionTooltip
                          label={
                            merchant.enabled
                              ? "Pause future scraping for this merchant"
                              : "Allow this merchant to be scraped again"
                          }
                        >
                          <Button
                            type="button"
                            size="sm"
                            variant={merchant.enabled ? "destructive" : "outline"}
                            disabled={pendingAction === `merchant:${merchant.id}`}
                            onClick={() =>
                              runAdminAction({
                                actionKey: `merchant:${merchant.id}`,
                                url: `/api/admin/merchants/${merchant.id}/enabled`,
                                body: {
                                  confirm: "set-merchant-enabled",
                                  enabled: !merchant.enabled,
                                },
                                prompt: merchant.enabled
                                  ? `Disable scraping for ${merchant.name}? Existing offers will not be hidden.`
                                  : `Enable scraping for ${merchant.name}?`,
                              })
                            }
                          >
                            {merchant.enabled ? (
                              <PowerOff aria-hidden="true" />
                            ) : (
                              <Power aria-hidden="true" />
                            )}
                            {merchant.enabled ? "Disable" : "Enable"}
                          </Button>
                        </ActionTooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PageControls
            page={merchantPage}
            pageCount={merchantPageCount}
            totalItems={filteredMerchants.length}
            pageSize={merchantPageSize}
            onPageChange={setMerchantPage}
          />
        </section>
      ) : null}

      {activeTab === "offers" ? (
        <section className="rounded-lg border border-amber-200 bg-white/95 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-medium">Recent Offers</h2>
            <StatusPill value={`${formatNumber(filteredOffers.length)} shown`} />
          </div>
          <FilterToolbar
            search={offerSearch}
            searchLabel="Search product, merchant, status, price"
            sort={offerSort}
            sortOptions={[
              { value: "updated", label: "Recently updated" },
              { value: "product", label: "Product A-Z" },
              { value: "merchant", label: "Merchant A-Z" },
              { value: "price", label: "Lowest price" },
              { value: "scrape", label: "Scrape status" },
            ]}
            onSearchChange={setOfferSearch}
            onSortChange={(value) => setOfferSort(value as OfferSortKey)}
          />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-amber-100 bg-amber-50/60 text-xs text-amber-900">
                <tr>
                  <th className="py-2 pr-3 font-medium">Offer</th>
                  <th className="py-2 pr-3 font-medium">Merchant</th>
                  <th className="py-2 pr-3 font-medium">Price</th>
                  <th className="py-2 pr-3 font-medium">Scrape</th>
                  <th className="py-2 pr-3 font-medium">Last Scraped</th>
                  <th className="py-2 pr-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedOffers.map((offer) => (
                  <tr key={offer.id}>
                    <td className="max-w-[20rem] py-3 pr-3">
                      <p className="truncate font-medium">{offer.productTitle}</p>
                      <p className="text-xs text-muted-foreground">Offer {offer.id}</p>
                    </td>
                    <td className="py-3 pr-3">
                      {offer.merchantName ?? offer.site}
                    </td>
                    <td className="py-3 pr-3">UGX {formatMoney(offer.price)}</td>
                    <td className="py-3 pr-3">
                      <StatusPill value={offer.scrapeStatus} />
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {formatDate(offer.lastScrapedAt)}
                    </td>
                    <td className="py-3 pr-3">
                      <ActionTooltip
                        label={
                          offer.scrapeStatus === "failed"
                            ? "Return this offer to public catalog eligibility"
                            : "Hide this offer from the public catalog"
                        }
                      >
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            offer.scrapeStatus === "failed"
                              ? "outline"
                              : "destructive"
                          }
                          disabled={pendingAction === `offer:${offer.id}`}
                          onClick={() =>
                            runAdminAction({
                              actionKey: `offer:${offer.id}`,
                              url: `/api/admin/offers/${offer.id}/${
                                offer.scrapeStatus === "failed"
                                  ? "unhide"
                                  : "hide"
                              }`,
                              body: {
                                confirm:
                                  offer.scrapeStatus === "failed"
                                    ? "unhide-offer"
                                    : "hide-offer",
                              },
                              prompt:
                                offer.scrapeStatus === "failed"
                                  ? `Unhide offer ${offer.id}?`
                                  : `Hide offer ${offer.id} from the public catalog?`,
                            })
                          }
                        >
                          {offer.scrapeStatus === "failed" ? (
                            <Eye aria-hidden="true" />
                          ) : (
                            <EyeOff aria-hidden="true" />
                          )}
                          {offer.scrapeStatus === "failed" ? "Unhide" : "Hide"}
                        </Button>
                      </ActionTooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PageControls
            page={offerPage}
            pageCount={offerPageCount}
            totalItems={filteredOffers.length}
            pageSize={offerPageSize}
            onPageChange={setOfferPage}
          />
        </section>
      ) : null}

      {activeTab === "scrape-runs" ? (
        <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <div className="rounded-lg border border-violet-200 bg-white/95 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock3 className="size-4" aria-hidden="true" />
                <h2 className="text-base font-medium">Recent Scrape Runs</h2>
              </div>
              <StatusPill value={`${formatNumber(filteredScrapeRuns.length)} shown`} />
            </div>
            <FilterToolbar
              search={scrapeRunSearch}
              searchLabel="Search run ID, status, counts"
              sort={scrapeRunSort}
              sortOptions={[
                { value: "started", label: "Recently started" },
                { value: "status", label: "Status A-Z" },
                { value: "failures", label: "Most failures" },
                { value: "jobs", label: "Most jobs" },
              ]}
              onSearchChange={setScrapeRunSearch}
              onSortChange={(value) =>
                setScrapeRunSort(value as ScrapeRunSortKey)
              }
            />
            <div className="mt-4 grid gap-3">
              {pagedScrapeRuns.length > 0 ? (
                pagedScrapeRuns.map((run) => (
                  <div
                    className="rounded-md border border-violet-100 bg-violet-50/40 p-3"
                    key={run.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium">Run {run.id}</p>
                      <StatusPill value={run.status} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {run.successCount} success, {run.failureCount} failed of{" "}
                      {run.totalJobs} jobs
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Started {formatDate(run.startedAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No scrape runs recorded.
                </p>
              )}
            </div>
            <PageControls
              page={scrapeRunPage}
              pageCount={scrapeRunPageCount}
              totalItems={filteredScrapeRuns.length}
              pageSize={scrapeRunPageSize}
              onPageChange={setScrapeRunPage}
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
            <h2 className="text-base font-medium">Ops Commands</h2>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <code className="rounded-md bg-background px-2 py-1">
                npm.cmd run scrape:report:dev
              </code>
              <code className="rounded-md bg-background px-2 py-1">
                npm.cmd run phase4f:check:dev
              </code>
              <code className="rounded-md bg-background px-2 py-1">
                npm.cmd run scrape:phase4g:pilot:dev:dry-run
              </code>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "scrape-probe" ? (
        <section className="rounded-lg border border-cyan-200 bg-white/95 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-medium">Scrape Probe</h2>
              <p className="text-sm text-muted-foreground">
                Test a product URL before adding or scheduling a merchant.
              </p>
            </div>
            {probeResult ? (
              <StatusPill
                value={probeResult.scrapeable ? "scrapeable" : "not scrapeable"}
                tone={probeResult.scrapeable ? "green" : "red"}
              />
            ) : null}
          </div>

          <form
            className="mt-4 grid gap-3 rounded-lg border border-cyan-100 bg-cyan-50/50 p-3 sm:grid-cols-[1fr_auto]"
            onSubmit={runScrapeProbe}
          >
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Product URL
              <Input
                value={probeUrl}
                onChange={(event) => setProbeUrl(event.target.value)}
                placeholder="https://merchant.example/product"
                type="url"
                required
              />
            </label>
            <div className="flex items-end">
              <ActionTooltip label="Test whether this product URL can be scraped">
                <Button type="submit" disabled={isProbeLoading}>
                  <Search aria-hidden="true" />
                  {isProbeLoading ? "Checking" : "Probe URL"}
                </Button>
              </ActionTooltip>
            </div>
          </form>

          {probeResult ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                <h3 className="text-sm font-medium">Result</h3>
                <dl className="mt-3 grid gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Merchant candidate</dt>
                    <dd className="font-medium">
                      {probeResult.merchantCandidate ?? "Unknown"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Strategy</dt>
                    <dd className="font-medium">
                      {probeResult.strategy.replace(/_/g, " ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Availability</dt>
                    <dd className="font-medium">
                      {probeResult.availability ?? "Unknown"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Canonical URL</dt>
                    <dd className="break-all font-medium">
                      {probeResult.canonicalUrl ?? "Not found"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border border-cyan-100 bg-white p-4">
                <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
                  <div className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {probeResult.image ? (
                      <img
                        src={probeResult.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-3 text-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-medium">
                      {probeResult.title ?? "No title extracted"}
                    </h3>
                    <div className="mt-3 grid gap-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Price:</span>{" "}
                        {probeResult.price
                          ? `UGX ${formatMoney(probeResult.price)}`
                          : "Not found"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Original:</span>{" "}
                        {probeResult.original
                          ? `UGX ${formatMoney(probeResult.original)}`
                          : "Not found"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Status:</span>{" "}
                        {probeResult.status ?? "Not found"}
                      </p>
                    </div>
                  </div>
                </div>

                {probeResult.warnings.length > 0 ? (
                  <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    {probeResult.warnings.join(" ")}
                  </div>
                ) : null}

                {probeResult.errors.length > 0 ? (
                  <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                    {probeResult.errors.join(" ")}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "products" && productTab === "add" ? (
        <section className="rounded-lg border border-fuchsia-200 bg-white/95 p-4 shadow-sm">
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-medium">
                  {editingProductId
                    ? `Edit Product ${editingProductId}`
                    : "Add Product"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Probe at least three merchant URLs, review the fields, then save the product.
                </p>
              </div>
              {editingProductId ? (
                <ActionTooltip label="Cancel editing and clear the form">
                  <Button type="button" variant="outline" onClick={resetProductForm}>
                    <X aria-hidden="true" />
                    Cancel Edit
                  </Button>
                </ActionTooltip>
              ) : null}
            </div>
          </div>

          <form className="mt-4 grid gap-5" onSubmit={createProduct}>
            <div className="grid gap-3 rounded-lg border border-fuchsia-100 bg-fuchsia-50/40 p-3 md:grid-cols-3">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Product title
                <Input
                  value={createTitle}
                  onChange={(event) =>
                    setCreateTitle(decodeHtmlEntities(event.target.value))
                  }
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Category
                <select
                  value={createCategory}
                  onChange={(event) => setCreateCategory(event.target.value)}
                  className="h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
                  required
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {visibleCategoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Image URL
                <Input
                  value={createImage}
                  onChange={(event) => setCreateImage(event.target.value)}
                  type="url"
                  required
                />
              </label>
            </div>

            {isCheckingDuplicates ? (
              <p className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
                Checking for similar products...
              </p>
            ) : null}

            {similarProducts.length > 0 ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />
                  <div className="grid gap-2">
                    <p className="font-medium">
                      This may already exist in the catalog.
                    </p>
                    <ul className="grid gap-1">
                      {similarProducts.slice(0, 3).map((product) => (
                        <li key={product.id}>
                          {product.title} | {product.category} | ID{" "}
                          {product.id} | {Math.round(product.score * 100)}%
                          similar
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start">
              <div className="lg:order-2">
                <AdminProductCardPreview
                  title={createTitle}
                  category={createCategory}
                  image={createImage}
                  offers={createOffers}
                />
              </div>

              <div className="grid gap-4 lg:order-1">
                {createOffers.map((offer, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
                  >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="grid flex-1 gap-1 text-sm font-medium text-slate-700">
                      Offer {index + 1} URL
                      <Input
                        value={offer.probeUrl}
                        onChange={(event) =>
                          updateCreateOffer(index, {
                            probeUrl: event.target.value,
                          })
                        }
                        type="url"
                        required
                      />
                    </label>
                    <ActionTooltip label="Fetch product details from this offer URL">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => probeCreateOffer(index)}
                        disabled={pendingProbeIndex === index}
                      >
                        <Search aria-hidden="true" />
                        {pendingProbeIndex === index ? "Checking" : "Probe"}
                      </Button>
                    </ActionTooltip>
                    <ActionTooltip label="Remove this offer row">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeCreateOffer(index)}
                        disabled={createOffers.length <= 3}
                      >
                        <Trash2 aria-hidden="true" />
                        Remove
                      </Button>
                    </ActionTooltip>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <StatusPill
                      value={offer.probeStatus}
                      tone={
                        offer.probeStatus === "Scrapeable"
                          ? "green"
                          : offer.probeStatus === "Not checked"
                            ? "slate"
                            : "red"
                      }
                    />
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <label className="grid gap-1 text-sm font-medium text-slate-700">
                      Merchant
                      <Input
                        value={offer.merchantName}
                        onChange={(event) =>
                          updateCreateOffer(index, {
                            merchantName: event.target.value,
                          })
                        }
                        required
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-medium text-slate-700">
                      Price
                      <Input
                        value={offer.price || ""}
                        onChange={(event) =>
                          updateCreateOffer(index, {
                            price: Number(event.target.value),
                          })
                        }
                        type="number"
                        min={1}
                        required
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-medium text-slate-700">
                      Original
                      <Input
                        value={offer.original || ""}
                        onChange={(event) =>
                          updateCreateOffer(index, {
                            original: Number(event.target.value),
                          })
                        }
                        type="number"
                        min={1}
                        required
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-medium text-slate-700">
                      Status
                      <Input
                        value={offer.status}
                        onChange={(event) =>
                          updateCreateOffer(index, {
                            status: event.target.value || "New",
                          })
                        }
                        required
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-medium text-slate-700">
                      Availability
                      <Input
                        value={offer.availability}
                        onChange={(event) =>
                          updateCreateOffer(index, {
                            availability: event.target.value || "unknown",
                          })
                        }
                        required
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-medium text-slate-700">
                      Canonical URL
                      <Input
                        value={offer.url}
                        onChange={(event) =>
                          updateCreateOffer(index, { url: event.target.value })
                        }
                        type="url"
                        required
                      />
                    </label>
                  </div>
                  </div>
                ))}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <ActionTooltip label="Add another merchant offer for this product">
                    <Button type="button" variant="outline" onClick={addCreateOffer}>
                      <Plus aria-hidden="true" />
                      Add Offer
                    </Button>
                  </ActionTooltip>
                  <ActionTooltip
                    label={
                      editingProductId
                        ? "Save changes to this product and its offers"
                        : "Create the product and save its offers"
                    }
                  >
                    <Button type="submit" disabled={isCreatingProduct}>
                      {editingProductId ? (
                        <Save aria-hidden="true" />
                      ) : (
                        <Tags aria-hidden="true" />
                      )}
                      {isCreatingProduct
                        ? editingProductId
                          ? "Saving"
                          : "Creating"
                        : editingProductId
                          ? "Save Changes"
                          : "Create Product"}
                    </Button>
                  </ActionTooltip>
                </div>
              </div>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
