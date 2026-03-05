import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import { ComponentsPage } from "./pages/ComponentsPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ComponentsPage />
  </StrictMode>,
);
