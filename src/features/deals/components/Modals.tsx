import { useState } from "react";
import { usePostHog } from "@posthog/react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ratingLabels: Record<string, string> = {
  "1": "Poor",
  "2": "Fair",
  "3": "Good",
  "4": "Very Good",
  "5": "Excellent",
};

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
