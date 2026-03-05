import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import { ElementsPage } from "./pages/ElementsPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ElementsPage />
  </StrictMode>,
);
