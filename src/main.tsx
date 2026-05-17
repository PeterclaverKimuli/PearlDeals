import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import posthog from "posthog-js";
import { PostHogProvider } from "@posthog/react";
import "./index.css";
import App from "./App.tsx";

if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: "https://app.posthog.com",
    defaults: "2026-01-30",
    before_send: (event) => {
      const exceptionMessage = String(
        event?.properties?.$exception_message ?? "",
      );

      if (
        event?.event === "$exception" &&
        exceptionMessage.includes("window.webkit.messageHandlers")
      ) {
        return null;
      }

      return event;
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </StrictMode>,
);
