import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/rust_dataflash_parser/" : "/",
  plugins: [react()],
  optimizeDeps: {
    include: ["maplibre-gl", "three", "@dvt3d/maplibre-three-plugin", "uplot"],
    exclude: ["parser-wasm"],
  },
  server: {
    fs: {
      allow: [".."],
    },
  },
}));
