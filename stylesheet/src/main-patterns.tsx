import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import { PatternsPage } from "./pages/PatternsPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PatternsPage />
  </StrictMode>,
);
