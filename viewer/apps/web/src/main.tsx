import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ViewerApp, createMockParserBackend } from "@dfv/viewer";
import "@dfv/viewer/styles.css";

const backend = createMockParserBackend("web");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ViewerApp backend={backend} />
  </StrictMode>,
);
