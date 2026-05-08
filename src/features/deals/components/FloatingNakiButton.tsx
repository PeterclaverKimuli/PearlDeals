import { useEffect, useState } from "react";
import { usePostHog } from "@posthog/react";
import { X } from "lucide-react";
import welcomeAvatar from "@/assets/Welcome intro.png";

const ctaVariant = "value_first";
const dismissedStorageKey = "pearldeals:naki-floating-cta-dismissed:v1";

export function FloatingNakiButton({
  source,
  category,
  title = "Need better deals?",
  description,
  badge,
  onOpenNaki,
}: {
  source: string;
  category?: string;
  title?: string;
  description?: string;
  badge?: string;
  onOpenNaki: () => void;
}) {
  const posthog = usePostHog();
  const [isHintDismissed, setIsHintDismissed] = useState(() => {
    if (typeof window === "undefined") return false;

    return window.localStorage.getItem(dismissedStorageKey) === "true";
  });
  const helperText =
    description ??
    (category
      ? `Find the best ${category} within your budget.`
      : "Tell Naki your budget and get matched deals.");
  const badgeText = badge ?? (category ? "Budget match" : "Free help");

  useEffect(() => {
    if (isHintDismissed) return;

    posthog.capture("naki_floating_cta_viewed", {
      source,
      cta_variant: ctaVariant,
      title,
      badge: badgeText,
      ...(category ? { category } : {}),
    });
  }, [badgeText, category, isHintDismissed, posthog, source, title]);

  const handleClick = () => {
    posthog.capture("naki_floating_button_clicked", {
      source,
      cta_variant: ctaVariant,
      ...(category ? { category } : {}),
    });
    onOpenNaki();
  };

  const dismissHint = () => {
    setIsHintDismissed(true);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(dismissedStorageKey, "true");
    }

    posthog.capture("naki_floating_cta_dismissed", {
      source,
      cta_variant: ctaVariant,
      ...(category ? { category } : {}),
    });
  };

  return (
    <div className="naki-floating-cta-enter fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[75] flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2 md:right-6 md:bottom-6">
      {!isHintDismissed ? (
        <div className="relative w-[min(17rem,calc(100vw-2rem))] rounded-2xl border border-emerald-900/10 bg-white px-4 py-3 pr-11 text-left shadow-2xl shadow-emerald-950/20 ring-1 ring-black/5">
          <span className="mb-1 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-wide text-amber-900">
            {badgeText}
          </span>
          <p className="text-sm font-black leading-5 text-gray-950">{title}</p>
          <p className="mt-1 text-xs leading-5 text-gray-600">{helperText}</p>
          <button
            type="button"
            onClick={dismissHint}
            className="absolute top-2.5 right-2.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-950 focus-visible:ring-3 focus-visible:ring-emerald-600/30"
            aria-label="Dismiss Naki helper prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      <button
        type="button"
        onClick={handleClick}
        className="group relative flex h-16 w-[min(18rem,calc(100vw-2rem))] cursor-pointer items-center gap-3 rounded-full border border-emerald-900/10 bg-gray-950 py-2 pr-4 pl-2 text-left text-white shadow-2xl shadow-emerald-950/30 ring-2 ring-white transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-950 hover:shadow-emerald-950/40 focus-visible:ring-4 focus-visible:ring-amber-300 md:w-[19rem]"
        aria-label={`${title} Talk to Naki shopping assistant`}
      >
        <span className="flex h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white bg-white shadow-sm">
          <img
            src={welcomeAvatar}
            alt="Naki shopping assistant"
            className="h-full w-full object-cover object-top"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-black leading-5">
            {title}
          </span>
          <span className="mt-0.5 inline-flex rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white transition group-hover:bg-green-500">
            Talk to Naki
          </span>
        </span>
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 h-5 w-5 animate-pulse rounded-full border-2 border-white bg-amber-300 shadow-md shadow-amber-950/20"
        />
      </button>
    </div>
  );
}
