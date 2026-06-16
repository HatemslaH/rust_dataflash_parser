import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ViewerApp, createMockParserBackend } from "@dfv/viewer";
import "@dfv/viewer/styles.css";

// Phase 0: mock backend. Phase 1: swap to createDesktopParserBackend().
const backend = createMockParserBackend("desktop");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ViewerApp backend={backend} />
  </StrictMode>,
);
