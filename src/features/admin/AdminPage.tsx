import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  LockKeyhole,
  LogOut,
  Plus,
  Search,
  Power,
  PowerOff,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Store,
  Tags,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  AdminCreateProductOfferInput,
  AdminMerchantRow,
  AdminOfferRow,
  AdminProductRow,
  AdminScrapeProbeResult,
  AdminScrapeRunRow,
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
type CreateOfferDraft = AdminCreateProductOfferInput & {
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
  | "scrape-probe"
  | "add-product";
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
  { id: "add-product", label: "Add Product" },
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

function formatDate(value: string | null) {
  if (!value) return "Not yet";

  return new Date(value).toLocaleString();
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
        <span className="min-w-16 text-center text-xs font-medium text-slate-500">
          {page} / {pageCount}
        </span>
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
      </div>
    </div>
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
            <Button type="button" variant="outline" onClick={handleLogout}>
              <LogOut aria-hidden="true" />
              Sign out
            </Button>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadDashboard}
                  disabled={isDashboardLoading}
                >
                  <RefreshCw aria-hidden="true" />
                  Refresh
                </Button>
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
  const [pendingProbeIndex, setPendingProbeIndex] = useState<number | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
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

      if (!createTitle && probe.title) setCreateTitle(probe.title);
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

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirm: "create-product",
          title: createTitle,
          category: createCategory,
          image: createImage,
          offers: createOffers.map(
            ({ merchantName, price, original, url, status, availability }) => ({
              merchantName,
              price,
              original,
              url,
              status,
              availability,
            }),
          ),
        }),
      });

      await readJson<unknown>(response);
      window.alert("Product created.");
      setCreateTitle("");
      setCreateCategory("");
      setCreateImage("");
      setCreateOffers([
        createEmptyOfferDraft(),
        createEmptyOfferDraft(),
        createEmptyOfferDraft(),
      ]);
      await onRefresh();
      setActiveTab("products");
    } catch (error) {
      window.alert(getErrorMessage(error));
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
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
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
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-sky-100 bg-sky-50/60 text-xs text-sky-800">
                <tr>
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
                    <td className="max-w-[18rem] py-3 pr-3">
                      <p className="truncate font-medium">{product.title}</p>
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
              <Button type="submit" disabled={isProbeLoading}>
                <Search aria-hidden="true" />
                {isProbeLoading ? "Checking" : "Probe URL"}
              </Button>
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

      {activeTab === "add-product" ? (
        <section className="rounded-lg border border-fuchsia-200 bg-white/95 p-4 shadow-sm">
          <div>
            <h2 className="text-base font-medium">Add Product</h2>
            <p className="text-sm text-muted-foreground">
              Probe at least three merchant URLs, review the fields, then create the product.
            </p>
          </div>

          <form className="mt-4 grid gap-5" onSubmit={createProduct}>
            <div className="grid gap-3 rounded-lg border border-fuchsia-100 bg-fuchsia-50/40 p-3 md:grid-cols-3">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Product title
                <Input
                  value={createTitle}
                  onChange={(event) => setCreateTitle(event.target.value)}
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Category
                <Input
                  value={createCategory}
                  onChange={(event) => setCreateCategory(event.target.value)}
                  required
                />
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

            <div className="grid gap-4">
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => probeCreateOffer(index)}
                      disabled={pendingProbeIndex === index}
                    >
                      <Search aria-hidden="true" />
                      {pendingProbeIndex === index ? "Checking" : "Probe"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removeCreateOffer(index)}
                      disabled={createOffers.length <= 3}
                    >
                      <Trash2 aria-hidden="true" />
                      Remove
                    </Button>
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
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" onClick={addCreateOffer}>
                <Plus aria-hidden="true" />
                Add Offer
              </Button>
              <Button type="submit" disabled={isCreatingProduct}>
                <Tags aria-hidden="true" />
                {isCreatingProduct ? "Creating" : "Create Product"}
              </Button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
