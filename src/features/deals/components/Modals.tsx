import { useEffect, useRef, useState } from "react";
import { usePostHog } from "@posthog/react";
import { ArrowRight, Check, Search, Star, Tags, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import feedbackAvatar from "@/assets/Feedback prompt.webp";
import welcomeAvatar from "@/assets/Welcome intro.webp";

const ratingLabels: Record<string, string> = {
  "1": "Poor",
  "2": "Fair",
  "3": "Good",
  "4": "Very Good",
  "5": "Excellent",
};
const nakiModalTypedTitle = "I am Naki";

export function WaitlistModal({
  open,
  onClose,
  productTitle,
}: {
  open: boolean;
  onClose: () => void;
  productTitle: string;
}) {
  const posthog = usePostHog();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    businessType: "",
  });
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    posthog.capture("waitlist_submitted", {
      product_title: productTitle,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      business_type: formData.businessType.trim(),
    });

    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div>
            <p className="text-sm font-medium text-green-600">
              Join the waiting list
            </p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              Post a better price
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Leave your details and we&apos;ll let you know when seller
              submissions open for
              <span className="font-medium text-gray-700"> {productTitle}</span>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close waiting list modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter your full name"
                required
                className="h-11"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Phone number
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Enter your phone number"
                required
                className="h-11"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email address
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter your email address"
                required
                className="h-11"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Type of business
              </label>
              <Input
                value={formData.businessType}
                onChange={(e) => handleChange("businessType", e.target.value)}
                placeholder="Example: Retailer, Distributor, Wholesaler"
                className="h-11"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-11 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-11 cursor-pointer bg-green-600 text-white hover:bg-green-700"
              >
                Join waiting list
              </Button>
            </div>
          </form>
        ) : (
          <div className="px-6 py-8">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
                <Check className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                You&apos;re on the list
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Thanks, {formData.name}. We&apos;ve saved your details and will
                reach out when better-price submissions are available for this
                product.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                onClick={onClose}
                className="cursor-pointer bg-green-600 text-white hover:bg-green-700"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PriceDropAlertModal({
  open,
  onClose,
  productTitle,
  productId,
  category,
  currentBestPrice,
  bestSite,
}: {
  open: boolean;
  onClose: () => void;
  productTitle: string;
  productId: number;
  category: string;
  currentBestPrice: number;
  bestSite: string;
}) {
  const posthog = usePostHog();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;

    setFormData({
      name: "",
      email: "",
    });
    setSubmitted(false);
  }, [open]);

  if (!open) return null;

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    posthog.capture("price_drop_alert_requested", {
      product_title: productTitle,
      product_id: productId,
      category,
      current_best_price: currentBestPrice,
      best_site: bestSite,
      name: formData.name.trim(),
      email: formData.email.trim(),
    });

    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div>
            <p className="text-sm font-medium text-green-600">Price alert</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              Want to know when the price drops?
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Leave your email and we will let you know when this product gets
              cheaper.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close price drop alert modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input
                value={formData.name}
                onChange={(event) => handleChange("name", event.target.value)}
                placeholder="Enter your full name"
                required
                className="h-11"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email address
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(event) => handleChange("email", event.target.value)}
                placeholder="Enter your email address"
                required
                className="h-11"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-11 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-11 cursor-pointer bg-green-600 text-white hover:bg-green-700"
              >
                Notify me
              </Button>
            </div>
          </form>
        ) : (
          <div className="px-6 py-8">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
                <Check className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                You&apos;re on the list
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                We will let you know when the price drops for this product.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                onClick={onClose}
                className="cursor-pointer bg-green-600 text-white hover:bg-green-700"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function UnavailableProductModal({
  open,
  onClose,
  searchQuery,
}: {
  open: boolean;
  onClose: () => void;
  searchQuery: string;
}) {
  const posthog = usePostHog();
  const requestedProductInputRef = useRef<HTMLInputElement | null>(null);
  const [formData, setFormData] = useState({
    requestedProduct: searchQuery,
    email: "",
    note: "",
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;

    setFormData({
      requestedProduct: searchQuery,
      email: "",
      note: "",
    });
    setSubmitted(false);

    window.setTimeout(() => {
      requestedProductInputRef.current?.focus();
      requestedProductInputRef.current?.select();
    }, 0);
  }, [open, searchQuery]);

  if (!open) return null;

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    posthog.capture("unavailable_product_requested", {
      search_query: searchQuery,
      requested_product: formData.requestedProduct.trim(),
      email: formData.email.trim(),
      note: formData.note.trim(),
      source: "search_no_results",
    });

    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div>
            <p className="text-sm font-medium text-green-600">
              Product request
            </p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              Want us to watch for it?
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              The product is not available right now. Please provide us with
              more information and we will let you know once it is available.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close unavailable product modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Product name or details
              </label>
              <Input
                ref={requestedProductInputRef}
                value={formData.requestedProduct}
                onChange={(event) =>
                  handleChange("requestedProduct", event.target.value)
                }
                placeholder="Example: iPhone 13 Pro Max"
                required
                className="h-11"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Extra details
              </label>
              <textarea
                value={formData.note}
                onChange={(event) => handleChange("note", event.target.value)}
                placeholder="Brand, model, condition, budget, or anything else we should know..."
                rows={4}
                className="w-full rounded-md border border-gray-200 px-3 py-3 text-base outline-none focus:border-green-500 md:text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email address
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(event) => handleChange("email", event.target.value)}
                placeholder="Enter your email address"
                required
                className="h-11"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-11 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-11 cursor-pointer bg-green-600 text-white hover:bg-green-700"
              >
                Notify me
              </Button>
            </div>
          </form>
        ) : (
          <div className="px-6 py-8">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
                <Check className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                You&apos;re on the list
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                We&apos;ll let you know when this product becomes available.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                onClick={onClose}
                className="cursor-pointer bg-green-600 text-white hover:bg-green-700"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function LeaveSiteModal({
  open,
  siteName,
  onClose,
  onContinue,
}: {
  open: boolean;
  siteName: string;
  onClose: () => void;
  onContinue: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
        <div className="border-b px-6 py-5">
          <p className="text-sm font-medium text-gray-900">
            <span className="text-gray-900">Pearl</span>
            <span className="text-green-600">Deals</span>
          </p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">
            Continue to site?
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            You are leaving PearlDeals and going to the {siteName} site page.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 px-6 py-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 cursor-pointer"
          >
            Stay on PearlDeals
          </Button>
          <Button
            type="button"
            onClick={onContinue}
            className="h-11 cursor-pointer bg-green-600 text-white hover:bg-green-700"
          >
            Continue to Site
          </Button>
        </div>
      </div>
    </div>
  );
}

export function NakiScrollPromptModal({
  open,
  onClose,
  onStartShopping,
}: {
  open: boolean;
  onClose: () => void;
  onStartShopping: () => void;
}) {
  const posthog = usePostHog();
  const [typedTitleLength, setTypedTitleLength] = useState(0);

  useEffect(() => {
    if (!open) return;

    posthog.capture("naki_scroll_prompt_viewed", {
      source: "homepage_after_hero",
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      posthog.capture("naki_scroll_prompt_dismissed", {
        source: "homepage_after_hero",
        dismiss_method: "escape",
      });
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open, posthog]);

  useEffect(() => {
    if (!open) return;

    setTypedTitleLength(0);
    const intervalId = window.setInterval(() => {
      setTypedTitleLength((current) => {
        if (current >= nakiModalTypedTitle.length) {
          window.clearInterval(intervalId);
          return current;
        }

        return current + 1;
      });
    }, 95);

    return () => window.clearInterval(intervalId);
  }, [open]);

  if (!open) return null;

  const handleDismiss = (dismissMethod: string) => {
    posthog.capture("naki_scroll_prompt_dismissed", {
      source: "homepage_after_hero",
      dismiss_method: dismissMethod,
    });
    onClose();
  };

  const handleStartShopping = () => {
    posthog.capture("naki_scroll_prompt_opened", {
      source: "homepage_after_hero",
    });
    onStartShopping();
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm"
      onClick={() => handleDismiss("overlay")}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="naki-scroll-prompt-title"
        className="naki-modal-enter relative w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-emerald-900/10 bg-white shadow-2xl shadow-emerald-950/25"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_18%_20%,rgba(250,204,21,0.28),transparent_34%),linear-gradient(120deg,#ecfdf5,#fff7ed)] sm:h-36" />
        <div className="relative px-5 pt-6 pb-5 sm:px-6 sm:pt-7 sm:pb-6">
          <div className="grid gap-4 sm:grid-cols-[6rem_minmax(0,1fr)] sm:items-center">
            <div className="mx-auto flex h-24 w-24 items-end justify-center overflow-hidden rounded-3xl border border-white bg-white shadow-xl shadow-emerald-950/10 sm:mx-0">
              <img
                src={welcomeAvatar}
                alt="Naki shopping assistant"
                className="h-full w-full object-cover object-top"
              />
            </div>

            <div className="min-w-0 text-center sm:text-left">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-900">
                <SparkleDot />
                PearlDeals assistant
              </p>
              <h2
                id="naki-scroll-prompt-title"
                className="mt-3 text-2xl font-black leading-tight text-gray-950 sm:text-3xl"
              >
                Hi,{" "}
                <span className="text-green-600">
                  {nakiModalTypedTitle.slice(0, typedTitleLength)}
                </span>
                {typedTitleLength >= nakiModalTypedTitle.length ? "." : null}
                {typedTitleLength < nakiModalTypedTitle.length ? (
                  <span className="text-green-600">|</span>
                ) : null}
              </h2>
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-gray-600 sm:mt-8 sm:text-base sm:leading-7">
            Tell me your budget and what you need. I will help you find the
            best deals across trusted sites in Uganda.
          </p>

          <div className="mt-5 grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
                <Search className="h-4 w-4" />
              </span>
              Budget matching
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
                <Tags className="h-4 w-4" />
              </span>
              Trusted deal picks
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDismiss("back_to_deals")}
              className="h-11 cursor-pointer rounded-full px-5"
            >
              Back to deals
            </Button>
            <Button
              type="button"
              onClick={handleStartShopping}
              className="h-11 cursor-pointer rounded-full bg-green-600 px-6 font-bold text-white hover:bg-green-700"
            >
              Start shopping
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SparkleDot() {
  return (
    <span
      aria-hidden="true"
      className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.18)]"
    />
  );
}

export function FeedbackModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const posthog = usePostHog();
  const [formData, setFormData] = useState({
    name: "",
    rating: "",
    feedback: "",
  });
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.rating) return;

    posthog.capture("feedback_submitted", {
      name: formData.name.trim() || "Anonymous",
      rating: Number(formData.rating),
      rating_label: ratingLabels[formData.rating],
      feedback: formData.feedback.trim(),
    });

    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div>
            <p className="text-sm font-medium text-green-600">Feedback</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              Help us improve <span className="text-gray-900">Pearl</span>
              <span className="text-green-600">Deals</span>
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Tell us what you like, what is missing, or what could work better.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close feedback modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter your name"
                className="h-11"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Rating
              </label>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = Number(formData.rating || 0) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleChange("rating", String(star))}
                        className={`cursor-pointer text-3xl transition ${isActive ? "text-green-600" : "text-gray-300 hover:text-green-400"}`}
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
                <div className="text-center text-sm text-gray-500">
                  {formData.rating
                    ? ratingLabels[formData.rating]
                    : "No rating yet"}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Your feedback
              </label>
              <textarea
                value={formData.feedback}
                onChange={(e) => handleChange("feedback", e.target.value)}
                placeholder="Share your thoughts..."
                required
                rows={5}
                className="w-full rounded-md border border-gray-200 px-3 py-3 text-base outline-none focus:border-green-500 md:text-sm"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-11 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!formData.rating}
                className="h-11 cursor-pointer bg-green-600 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Submit Feedback
              </Button>
            </div>
          </form>
        ) : (
          <div className="px-6 py-8">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
                <Check className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Thanks for your feedback
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                We appreciate you helping us improve PearlDeals.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                onClick={onClose}
                className="cursor-pointer bg-green-600 text-white hover:bg-green-700"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function RecommendationFeedbackModal({
  open,
  onClose,
  hasBrief,
  basketCount,
}: {
  open: boolean;
  onClose: () => void;
  hasBrief: boolean;
  basketCount: number;
}) {
  const posthog = usePostHog();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const canSubmit = rating > 0 && feedback.trim().length > 0;

  useEffect(() => {
    if (!open) return;

    setRating(0);
    setFeedback("");
    setSubmitted(false);
  }, [open]);

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    posthog.capture("recommendation_feedback_submitted", {
      rating,
      feedback: feedback.trim(),
      has_brief: hasBrief,
      basket_count: basketCount,
    });

    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-4">
      <div className="my-3 max-h-[calc(100vh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-2xl sm:my-0 sm:max-h-[calc(100vh-2rem)]">
        <div className="relative border-b px-4 py-4 pr-14 sm:flex sm:items-start sm:justify-between sm:px-6 sm:py-5 sm:pr-6">
          <div className="sm:hidden">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 max-[320px]:h-6 max-[320px]:w-6"
              aria-label="Close recommendation feedback modal"
            >
              <X className="h-5 w-5 max-[320px]:h-3.5 max-[320px]:w-3.5" />
            </button>
          </div>
          <div className="flex min-w-0 items-start gap-3 sm:flex-1 sm:gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center sm:h-20 sm:w-20">
              <img
                src={feedbackAvatar}
                alt="Naki asking for feedback"
                className="h-full w-full object-contain object-center"
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold leading-snug text-gray-900 sm:text-2xl">
                How were the recommendations?
              </h2>
              <p className="mt-1 text-xs leading-5 text-gray-500 sm:mt-2 sm:text-sm sm:leading-6">
                Rate the results and tell us what would make them more useful.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 sm:flex"
            aria-label="Close recommendation feedback modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 px-4 py-5 sm:space-y-5 sm:px-6 sm:py-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Rating
              </label>
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = rating >= star;

                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`cursor-pointer rounded-full p-1 transition ${
                        isActive
                          ? "text-green-600"
                          : "text-gray-300 hover:text-green-400"
                      }`}
                      aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`h-7 w-7 sm:h-8 sm:w-8 ${isActive ? "fill-current" : ""}`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-center text-sm text-gray-500">
                {rating > 0 ? ratingLabels[String(rating)] : "No rating yet"}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Your feedback
              </label>
              <textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Tell us what worked, what missed, or what you wanted to see..."
                required
                rows={4}
                className="w-full rounded-md border border-gray-200 px-3 py-3 text-base outline-none focus:border-green-500 md:text-sm"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-11 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="h-11 cursor-pointer bg-green-600 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Submit feedback
              </Button>
            </div>
          </form>
        ) : (
          <div className="px-4 py-6 sm:px-6 sm:py-8">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
                <Check className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Thanks for helping us tune this
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Your feedback helps PearlDeals make Naki&apos;s recommendations
                more useful.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                onClick={onClose}
                className="cursor-pointer bg-green-600 text-white hover:bg-green-700"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
