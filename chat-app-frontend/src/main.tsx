import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/app/styles/index.css";
import { App } from "@/app/index.tsx";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
