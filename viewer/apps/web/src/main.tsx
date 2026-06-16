import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ViewerApp, createWebParserBackend } from "@dfv/viewer";
import "@dfv/viewer/styles.css";

const backend = createWebParserBackend();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ViewerApp backend={backend} />
  </StrictMode>,
);
