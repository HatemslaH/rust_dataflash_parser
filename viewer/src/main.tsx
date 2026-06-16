import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@mantine/core/styles.css";
import "./styles.css";
import ViewerApp from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ViewerApp />
  </StrictMode>,
);
