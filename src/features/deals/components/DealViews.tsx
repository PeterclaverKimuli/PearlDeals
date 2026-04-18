import { useState } from "react";
import { usePostHog } from "@posthog/react";
import { Heart, PlusCircle, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { imageFallback } from "../data";
import type { EnrichedDeal } from "../types";
import { formatUGX, shareDeal } from "../utils";
import { ActionPopover, ProductImage, ShareToast } from "./AppChrome";
import { LeaveSiteModal, WaitlistModal } from "./Modals";

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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <Button
          className="mb-4 cursor-pointer"
          variant="outline"
          onClick={onBack}
        >
          ← Back
        </Button>

        <Card className="h-full overflow-hidden rounded-2xl shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="flex h-64 w-full items-center justify-center overflow-hidden bg-gray-100 lg:h-full">
              <img
                src={deal.image || imageFallback}
                alt={deal.title}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = imageFallback;
                }}
                className="h-full w-full bg-white p-4 object-contain transition duration-300 hover:scale-105"
              />
            </div>

            <CardContent className="p-4 md:p-8">
              <div className="mb-4 flex items-start justify-between gap-4">
                <h1 className="text-3xl font-bold leading-tight">
                  {deal.title}
                </h1>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold text-green-700">
                  {formatUGX(deal.bestDeal.price)}
                </span>
                {deal.bestDeal.original > deal.bestDeal.price && (
                  <span className="mt-1 ml-0 block text-xs text-gray-400 line-through md:mt-0 md:ml-3 md:inline md:text-sm">
                    {formatUGX(deal.bestDeal.original)}
                  </span>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-green-100 px-2 py-1 text-sm font-semibold text-green-700">
                    Best price{deal.discount > 0 ? ` -${deal.discount}%` : ""}
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

              <div className="mb-3 rounded-2xl border bg-white p-4">
                <h2 className="mb-3 text-lg font-semibold">Price comparison</h2>
                <div className="space-y-3">
                  {deal.prices.map((p, idx) => {
                    const isBest = p.price === deal.bestDeal.price;

                    return (
                      <div
                        key={`${deal.id}-${idx}`}
                        className="flex flex-col gap-3 rounded-xl border p-3 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-medium">{p.site}</p>
                          {p.original > p.price && (
                            <p className="text-sm text-gray-500">
                              Original: {formatUGX(p.original)}
                            </p>
                          )}
                          {p.status ? (
                            <p className="text-xs text-gray-400">
                              Condition: {p.status}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:flex-row md:items-center md:justify-end">
                          <div className="text-left md:text-right">
                            <p
                              className={`text-xs font-semibold md:text-sm ${isBest ? "text-green-700" : ""}`}
                            >
                              {formatUGX(p.price)}
                            </p>
                            {isBest ? (
                              <p className="text-xs font-medium text-green-700">
                                Best price
                              </p>
                            ) : null}
                          </div>

                          {p.url ? (
                            <button
                              type="button"
                              onClick={() => handleSiteClick(p.url, p.site)}
                              className="mt-2 inline-flex w-full cursor-pointer items-center justify-center rounded-full bg-black px-3 py-2 text-xs text-white hover:bg-gray-800 md:mt-0 md:w-auto"
                            >
                              Go to Site
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="mt-2 w-full cursor-not-allowed rounded-full bg-gray-300 px-3 py-2 text-xs text-gray-500 md:mt-0 md:w-auto"
                            >
                              No Link
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-1 mb-6 flex items-center justify-end gap-2">
                <div className="group relative">
                  <button
                    type="button"
                    onClick={() => setIsWaitlistOpen(true)}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center"
                    aria-label="Add deal"
                  >
                    <PlusCircle className="h-8 w-8 text-gray-400 hover:text-gray-600" />
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
                    className="flex h-10 w-10 cursor-pointer items-center justify-center"
                    aria-label="Share this deal"
                  >
                    <Share2 className="h-7 w-7 text-gray-400 hover:text-gray-600" />
                  </button>
                  <ActionPopover label="Share this deal" />
                </div>

                <div className="group relative">
                  <button
                    type="button"
                    onClick={() => setLiked((prev) => !prev)}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center"
                    aria-label="Like this deal"
                  >
                    <Heart
                      className={`h-7 w-7 transition ${liked ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-500"}`}
                    />
                  </button>
                  <ActionPopover label="Like this deal" />
                </div>
              </div>

              {shareMessage && <ShareToast message={shareMessage} />}
              <WaitlistModal
                key={isWaitlistOpen ? `${deal.id}-waitlist-open` : `${deal.id}-waitlist-closed`}
                open={isWaitlistOpen}
                onClose={() => setIsWaitlistOpen(false)}
                productTitle={deal.title}
              />
              <LeaveSiteModal
                open={!!pendingSite}
                siteName={pendingSite?.site || "selected"}
                onClose={() => setPendingSite(null)}
                onContinue={handleContinueToSite}
              />

              <div className="rounded-2xl border bg-white p-4">
                <h2 className="mb-2 text-lg font-semibold">
                  Why this deal stands out
                </h2>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>
                    Lowest listed price across {deal.prices.length} sites.
                  </li>
                  <li>Savings of {deal.discount}% off the reference price.</li>
                  <li>
                    Easy side-by-side comparison before you leave the app.
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
}: {
  deal: EnrichedDeal;
  onSelect: (deal: EnrichedDeal) => void;
}) {
  const posthog = usePostHog();
  const bestPrice = deal.bestDeal.price;
  const bestDeal = deal.bestDeal;
  const discount = deal.discount;

  return (
    <Card className="flex flex-col rounded-2xl shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <ProductImage src={deal.image} alt={deal.title} />

      <CardContent className="flex flex-grow flex-col p-3 text-sm">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <h2 className="min-w-0 flex-1 text-lg font-semibold leading-tight">
            {deal.title}
          </h2>
        </div>

        <div className="mb-3">
          <span className="rounded-md bg-green-100 px-2 py-1 text-sm font-semibold text-green-700">
            Best price{discount > 0 ? ` -${discount}%` : ""}
          </span>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-base font-bold text-green-700 md:text-lg">
              {formatUGX(bestDeal.price)}
            </span>
            {bestDeal.original > bestDeal.price && (
              <span className="text-xs text-gray-400 line-through md:text-sm">
                {formatUGX(bestDeal.original)}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">{bestDeal.site}</p>
        </div>

        <div className="mb-3 space-y-2">
          {deal.prices.map((p, index) => (
            <div
              key={`${deal.id}-${index}`}
              className="flex flex-wrap justify-between gap-2 text-sm"
            >
              <span className="flex items-center gap-1 text-gray-600">
                <span>{p.site}</span>
                {p.price === bestPrice && (
                  <span className="text-green-600" aria-label="Best price site">
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
          <Button
            className="w-full cursor-pointer"
            onClick={() => {
              posthog.capture("product_opened", {
                product: deal.title,
                category: deal.category,
              });
              onSelect(deal);
            }}
          >
            View & Compare
          </Button>
        </div>
      </CardContent>
    </Card>
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

  return (
    <Card className="h-full overflow-hidden rounded-2xl shadow-lg">
      <div className="grid h-full grid-cols-1 md:grid-cols-2">
        <div className="order-2 flex min-h-[180px] flex-col justify-between bg-white p-5 text-gray-900 md:order-1 md:min-h-[220px] md:p-6 md:pr-6">
          <div>
            <h3 className="mb-2 text-lg font-bold leading-tight md:text-xl">
              {deal.title}
            </h3>
            {deal.discount > 0 && (
              <p className="mb-2 text-sm text-gray-500 md:mb-3">
                Get upto {deal.discount}% Off
              </p>
            )}
          </div>

          <Button
            className="mt-4 w-full cursor-pointer rounded-full bg-gray-900 px-3 py-2 text-sm text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-xl active:scale-95 md:mt-6 md:w-fit"
            onClick={() => {
              posthog.capture("product_opened", {
                product: deal.title,
                category: deal.category,
              });
              onSelect(deal);
            }}
          >
            Grab This Deal 🔥
          </Button>
        </div>

        <div className="order-1 flex h-48 w-full items-center justify-center overflow-hidden bg-gray-100 md:order-2 md:h-full">
          <img
            src={deal.image || imageFallback}
            alt={deal.title}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = imageFallback;
            }}
            className="h-full w-full bg-white p-4 object-contain"
          />
        </div>
      </div>
    </Card>
  );
}
