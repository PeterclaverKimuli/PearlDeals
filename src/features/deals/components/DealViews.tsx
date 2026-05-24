import { useState } from "react";
import { usePostHog } from "@posthog/react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BellRing,
  Flame,
  Heart,
  PlusCircle,
  Scale,
  Share2,
  Store,
  Tag,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { imageFallback } from "../data";
import type { EnrichedDeal } from "../types";
import {
  formatMerchantDisplayName,
  formatUGX,
  getSavingsAmount,
  shareDeal,
} from "../utils";
import { ActionPopover, ProductImage, ShareToast } from "./AppChrome";
import {
  LeaveSiteModal,
  PriceDropAlertModal,
  WaitlistModal,
} from "./Modals";

export function DealDetails({
  deal,
  onBack,
}: {
  deal: EnrichedDeal;
  onBack: () => void;
}) {
  const posthog = usePostHog();
  const [liked, setLiked] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [isPriceDropAlertOpen, setIsPriceDropAlertOpen] = useState(false);
  const [pendingSite, setPendingSite] = useState<{
    url: string;
    site: string;
  } | null>(null);

  const handleShare = async () => {
    const result = await shareDeal(deal);

    if (result === "copied") {
      setShareMessage(
        "Link copied to clipboard. Paste it anywhere to share this deal.",
      );
    } else if (result === "shared") {
      setShareMessage("This deal has been shared successfully.");
    } else if (result === "failed") {
      setShareMessage("Unable to share right now.");
    } else {
      setShareMessage(null);
    }

    if (result !== "cancelled") {
      window.setTimeout(() => setShareMessage(null), 1800);
    }
  };

  const handleSiteClick = (url?: string, site?: string) => {
    if (!url) return;

    posthog.capture("site_clicked", {
      product: deal.title,
      site,
      category: deal.category,
      price: deal.bestDeal?.price,
    });

    setPendingSite({ url, site: site || "selected" });
  };

  const handleContinueToSite = () => {
    if (!pendingSite || typeof window === "undefined") return;
    window.location.href = pendingSite.url;
  };
  const handleOpenPriceDropAlert = () => {
    posthog.capture("price_drop_alert_opened", {
      product_title: deal.title,
      product_id: deal.id,
      category: deal.category,
      current_best_price: deal.bestDeal.price,
      best_site: deal.bestDeal.site,
    });
    setIsPriceDropAlertOpen(true);
  };
  const savingsAmount = getSavingsAmount(deal);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#f7fee7_34%,#f9fafb_62%)] p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <Button
          className="mb-4 cursor-pointer"
          variant="outline"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card className="h-full gap-0 overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-white shadow-2xl shadow-emerald-950/10">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="flex h-64 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-white to-emerald-50 lg:h-full">
              <img
                src={deal.image || imageFallback}
                alt={deal.title}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = imageFallback;
                }}
                className="h-full w-full p-5 object-contain object-top transition duration-300 hover:scale-105"
              />
            </div>

            <CardContent className="p-4 md:p-8">
              <div className="mb-4 flex items-start justify-between gap-4">
                <h1 className="text-3xl font-black leading-tight">
                  {deal.title}
                </h1>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold text-green-700">
                  {formatUGX(deal.bestDeal.price)}
                </span>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-red-500 px-3 py-1 text-sm font-black text-white shadow-sm">
                    Save {formatUGX(savingsAmount)}
                  </span>
                  <span className="text-sm text-gray-500">
                    at {deal.bestDeal.site}
                  </span>
                  {deal.bestDeal.status && (
                    <span className="text-xs text-gray-400">
                      • {deal.bestDeal.status}
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-3 rounded-3xl border border-emerald-900/10 bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-lg font-black">Price comparison</h2>
                <div className="space-y-3">
                  {deal.prices.map((p, idx) => {
                    const isBest = p.price === deal.bestDeal.price;

                    return (
                      <div
                        key={`${deal.id}-${idx}`}
                        className={`grid grid-cols-1 gap-3 rounded-2xl border p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,52%)] ${
                          isBest
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-medium">{p.site}</p>
                          {p.status ? (
                            <p className="text-xs text-gray-400">
                              Condition: {p.status}
                            </p>
                          ) : null}
                          {isBest ? (
                            <p className="mt-2 hidden items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-700 md:inline-flex md:whitespace-nowrap">
                              <Flame className="h-3 w-3" aria-hidden="true" />
                              Lowest price today
                            </p>
                          ) : null}
                        </div>

                        <div className="flex min-w-0 w-full flex-col items-stretch gap-2 md:items-end md:justify-center">
                          <div className="min-w-0 text-left md:text-right">
                            <p
                              className={`text-xs font-semibold md:text-sm ${isBest ? "text-green-700" : ""}`}
                            >
                              {formatUGX(p.price)}
                            </p>
                            {isBest ? (
                              <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-700 md:hidden">
                                <Flame className="h-3 w-3" aria-hidden="true" />
                                Lowest price today
                              </p>
                            ) : null}
                          </div>

                          {p.url ? (
                            <button
                              type="button"
                              onClick={() => handleSiteClick(p.url, p.site)}
                              className={`mt-2 inline-flex h-11 w-full min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-emerald-500/30 focus-visible:outline-none md:mt-0 md:w-auto md:max-w-[12rem] ${
                                isBest
                                  ? "bg-emerald-700 shadow-emerald-900/25 ring-1 ring-emerald-500/20 hover:bg-emerald-800 hover:shadow-lg hover:shadow-emerald-900/30"
                                  : "bg-gray-950 ring-1 ring-gray-900/10 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-900/20"
                              }`}
                            >
                              {isBest ? (
                                <Flame className="h-4 w-4" aria-hidden="true" />
                              ) : null}
                              <span className="min-w-0 truncate">
                                {isBest ? "Grab lowest price" : "Go to Site"}
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="mt-2 w-full min-w-0 cursor-not-allowed rounded-full bg-gray-300 px-3 py-2 text-xs text-gray-500 md:mt-0 md:w-auto md:max-w-[11rem]"
                            >
                              <span className="block truncate">No Link</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-1 mb-4 flex items-center justify-end gap-2">
                <div className="group relative">
                  <button
                    type="button"
                    onClick={() => setIsWaitlistOpen(true)}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md focus-visible:ring-4 focus-visible:ring-emerald-500/25 focus-visible:outline-none"
                    aria-label="Add deal"
                  >
                    <PlusCircle className="h-7 w-7" />
                  </button>
                  <ActionPopover label="Found a better price, Post it" />
                </div>

                <div className="group relative">
                  <button
                    type="button"
                    onClick={() => {
                      posthog.capture("deal_shared", {
                        product: deal.title,
                        category: deal.category,
                        price: deal.bestDeal?.price,
                      });

                      handleShare();
                    }}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md focus-visible:ring-4 focus-visible:ring-emerald-500/25 focus-visible:outline-none"
                    aria-label="Share this deal"
                  >
                    <Share2 className="h-6 w-6" />
                  </button>
                  <ActionPopover label="Share this deal" />
                </div>

                <div className="group relative">
                  <button
                    type="button"
                    onClick={() => setLiked((prev) => !prev)}
                    className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-4 focus-visible:ring-red-500/20 focus-visible:outline-none ${
                      liked
                        ? "border-red-200 bg-red-50 text-red-500"
                        : "border-gray-200 bg-white text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                    }`}
                    aria-label="Like this deal"
                  >
                    <Heart
                      className={`h-6 w-6 transition ${liked ? "fill-current" : ""}`}
                    />
                  </button>
                  <ActionPopover label="Like this deal" />
                </div>
              </div>

              <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-200">
                      <BellRing className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-900">
                        Want to know when the price drops?
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        Leave your email and we will let you know when this
                        product gets cheaper.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="h-12 shrink-0 cursor-pointer rounded-full bg-amber-400 px-6 font-black text-gray-950 shadow-lg shadow-amber-900/15 ring-1 ring-amber-300 transition hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-xl hover:shadow-amber-900/20 focus-visible:ring-4 focus-visible:ring-amber-300/50"
                    onClick={handleOpenPriceDropAlert}
                  >
                    <BellRing className="h-4 w-4" aria-hidden="true" />
                    Notify me
                  </Button>
                </div>
              </div>

              {shareMessage && <ShareToast message={shareMessage} />}
              <WaitlistModal
                key={isWaitlistOpen ? `${deal.id}-waitlist-open` : `${deal.id}-waitlist-closed`}
                open={isWaitlistOpen}
                onClose={() => setIsWaitlistOpen(false)}
                productTitle={deal.title}
              />
              <PriceDropAlertModal
                key={
                  isPriceDropAlertOpen
                    ? `${deal.id}-price-drop-open`
                    : `${deal.id}-price-drop-closed`
                }
                open={isPriceDropAlertOpen}
                onClose={() => setIsPriceDropAlertOpen(false)}
                productTitle={deal.title}
                productId={deal.id}
                category={deal.category}
                currentBestPrice={deal.bestDeal.price}
                bestSite={deal.bestDeal.site}
              />
              <LeaveSiteModal
                open={!!pendingSite}
                siteName={pendingSite?.site || "selected"}
                onClose={() => setPendingSite(null)}
                onContinue={handleContinueToSite}
              />

              <div className="rounded-3xl border border-emerald-900/10 bg-emerald-50 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
                    <BadgeCheck className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="text-lg font-black">
                    Why this deal stands out
                  </h2>
                </div>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-3">
                    <Store className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                    <span>
                    Lowest listed price across {deal.prices.length} sites.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Tag className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                    <span>
                      Save {formatUGX(savingsAmount)} across listed prices.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Scale className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                    <span>
                    Easy side-by-side comparison before you leave the app.
                    </span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function DealCard({
  deal,
  onSelect,
  showActionIcon = true,
}: {
  deal: EnrichedDeal;
  onSelect: (deal: EnrichedDeal) => void;
  showActionIcon?: boolean;
}) {
  const posthog = usePostHog();
  const bestPrice = deal.bestDeal.price;
  const bestDeal = deal.bestDeal;
  const savingsAmount = getSavingsAmount(deal);
  const openDeal = () => {
    posthog.capture("product_opened", {
      product: deal.title,
      category: deal.category,
      source: "product_card",
    });
    onSelect(deal);
  };

  return (
    <button
      type="button"
      onClick={openDeal}
      className="group/card relative flex h-full w-full cursor-pointer flex-col gap-0 overflow-hidden rounded-3xl border border-gray-200 bg-white py-0 text-left text-sm shadow-sm ring-0 transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-950/10 focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-500/30 focus-visible:outline-none"
      aria-label={`Compare prices for ${deal.title}`}
    >
      <div className="absolute left-3 top-2 z-10 rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white shadow-lg">
        Save {formatUGX(savingsAmount)}
      </div>
      <ProductImage src={deal.image} alt={deal.title} />

      <CardContent className="flex flex-grow flex-col p-3 text-sm">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <h2 className="line-clamp-2 min-w-0 flex-1 text-base font-black leading-tight text-gray-950 md:text-lg">
            {deal.title}
          </h2>
        </div>

        <div className="mb-3">
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xl font-black text-emerald-700">
              {formatUGX(bestDeal.price)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <Store className="h-3.5 w-3.5" />
              {formatMerchantDisplayName(bestDeal.site)}
              </span>
            {bestDeal.status ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                {bestDeal.status}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mb-3 space-y-2 rounded-2xl bg-gray-50 p-3">
          {deal.prices.map((p, index) => (
            <div
              key={`${deal.id}-${index}`}
              className="flex flex-wrap justify-between gap-2 text-sm"
            >
              <span className="flex items-center gap-1 text-gray-600">
                <span>{formatMerchantDisplayName(p.site)}</span>
                {p.price === bestPrice && (
                  <span className="text-green-600" aria-label="Lowest price site">
                    ★
                  </span>
                )}
              </span>
              <span
                className={`break-words text-right text-xs md:text-sm ${p.price === bestPrice ? "font-semibold text-green-700" : ""}`}
              >
                {formatUGX(p.price)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-3">
          <span
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-gray-950 px-2.5 font-bold whitespace-nowrap text-white transition-colors group-hover/card:bg-emerald-700"
            aria-hidden="true"
          >
            Compare prices
            {showActionIcon ? <ArrowRight className="h-4 w-4" /> : null}
          </span>
        </div>
      </CardContent>
    </button>
  );
}

export function FeaturedDealBanner({
  deal,
  onSelect,
}: {
  deal: EnrichedDeal;
  onSelect: (deal: EnrichedDeal) => void;
}) {
  const posthog = usePostHog();
  const savingsAmount = getSavingsAmount(deal);

  return (
    <Card className="h-full gap-0 overflow-hidden rounded-3xl border-0 bg-[linear-gradient(145deg,#064e3b,#111827)] py-0 text-white shadow-xl shadow-emerald-950/10">
      <div className="grid h-full grid-cols-1 bg-[linear-gradient(145deg,#064e3b,#111827)] lg:grid-cols-2">
        <div className="order-2 flex min-h-[180px] flex-col justify-between bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.24),transparent_36%),linear-gradient(145deg,#064e3b,#111827)] p-5 text-white md:min-h-[220px] md:p-6 lg:order-1 lg:pr-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-amber-100">
              <BadgeCheck className="h-3.5 w-3.5" />
              Best price found
            </div>
            <h3 className="mb-2 line-clamp-3 text-lg font-black leading-tight md:text-xl">
              {deal.title}
            </h3>
            {savingsAmount > 0 && (
              <p className="mb-2 text-sm font-semibold text-amber-200 md:mb-3">
                Save {formatUGX(savingsAmount)}
              </p>
            )}
            <p className="text-2xl font-black text-white">
              {formatUGX(deal.bestDeal.price)}
            </p>
            <p className="mt-1 text-xs text-emerald-50/70">
              Lowest at {deal.bestDeal.site}
            </p>
          </div>

          <Button
            className="mt-4 h-10 w-full cursor-pointer rounded-full bg-amber-300 px-4 text-sm font-black text-gray-950 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-200 hover:shadow-xl active:scale-95 md:mt-6 md:w-fit"
            onClick={() => {
              posthog.capture("product_opened", {
                product: deal.title,
                category: deal.category,
              });
              onSelect(deal);
            }}
          >
            Grab This Deal
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="order-1 flex h-48 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-white to-emerald-50 md:h-56 lg:order-2 lg:h-full">
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
      </div>
    </Card>
  );
}
