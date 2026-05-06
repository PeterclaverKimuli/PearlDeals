import { usePostHog } from "@posthog/react";
import welcomeAvatar from "@/assets/Welcome intro.png";

export function FloatingNakiButton({
  source,
  category,
  onOpenNaki,
}: {
  source: string;
  category?: string;
  onOpenNaki: () => void;
}) {
  const posthog = usePostHog();

  const handleClick = () => {
    posthog.capture("naki_floating_button_clicked", {
      source,
      ...(category ? { category } : {}),
    });
    onOpenNaki();
  };

  return (
    <div className="group fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[75] md:right-6 md:bottom-6">
      <div className="pointer-events-none absolute right-0 bottom-full mb-3 hidden w-56 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white opacity-0 shadow-md transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100 md:block">
        Let me help you with your shopping needs
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-0.5 -right-0.5 z-10 h-5 w-5 animate-pulse rounded-full border-2 border-white bg-green-600 shadow-md md:h-6 md:w-6"
      />
      <button
        type="button"
        onClick={handleClick}
        className="flex h-14 max-w-[calc(100vw-2rem)] cursor-pointer items-center gap-2 rounded-full border-4 border-white bg-green-600 pr-5 pl-1.5 text-sm font-semibold whitespace-nowrap text-white shadow-2xl shadow-green-900/30 transition duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-green-900/40 md:h-20 md:w-20 md:justify-center md:overflow-hidden md:bg-white md:p-0 md:hover:scale-110 md:hover:bg-white md:hover:shadow-2xl"
        aria-label="Open Naki shopping assistant"
      >
        <span className="flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white md:h-full md:w-full md:rounded-none">
          <img
            src={welcomeAvatar}
            alt="Naki shopping assistant"
            className="h-full w-full object-cover object-top"
          />
        </span>
        <span className="md:sr-only">Ask Naki</span>
      </button>
    </div>
  );
}
