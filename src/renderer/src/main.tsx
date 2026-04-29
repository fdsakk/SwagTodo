import "@fontsource/geist-sans/400.css"
import "@fontsource/geist-sans/500.css"
import "@fontsource/geist-sans/600.css"
import "./assets/main.css"

import { GlobalErrorBoundary } from "@renderer/components/layout"
import {
  AnchoredToastProvider,
  ToastProvider
} from "@renderer/components/ui/toast"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <ToastProvider>
        <AnchoredToastProvider>
          <App />
        </AnchoredToastProvider>
      </ToastProvider>
    </GlobalErrorBoundary>
  </StrictMode>
)
