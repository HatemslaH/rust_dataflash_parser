import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ViewerApp } from "@dfv/viewer";
import { createDesktopParserBackend } from "./platform";
import "@dfv/viewer/styles.css";

const backend = createDesktopParserBackend();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ViewerApp backend={backend} />
  </StrictMode>,
);
