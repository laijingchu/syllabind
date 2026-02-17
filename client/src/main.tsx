import { createRoot } from "react-dom/client";
import { PostHogProvider } from "@posthog/react";
import App from "./App";
import "./index.css";

const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
const isProduction = import.meta.env.PROD;

const options = {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
} as const;

createRoot(document.getElementById("root")!).render(
  posthogKey && isProduction ? (
    <PostHogProvider apiKey={posthogKey} options={options}>
      <App />
    </PostHogProvider>
  ) : (
    <App />
  ),
);
