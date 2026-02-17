import { createRoot } from "react-dom/client";
import { PostHogProvider } from "@posthog/react";
import App from "./App";
import "./index.css";

const options = {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
} as const;

createRoot(document.getElementById("root")!).render(
  <PostHogProvider
    apiKey={import.meta.env.VITE_POSTHOG_KEY}
    options={options}
  >
    <App />
  </PostHogProvider>,
);
