import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const files = [
  "C:/Work/JS/UAVLogViewer/src/assets/mavgraphs.xml",
  "C:/Work/JS/UAVLogViewer/src/assets/mavgraphs2.xml",
  "C:/Work/JS/UAVLogViewer/src/assets/ekfGraphs.xml",
  "C:/Work/JS/UAVLogViewer/src/assets/ekf3Graphs.xml",
];

const graphs = [];

for (const file of files) {
  const xml = fs.readFileSync(file, "utf8");
  const graphBlocks = xml.match(/<graph[^>]*>[\s\S]*?<\/graph>/g) ?? [];
  for (const block of graphBlocks) {
    const nameMatch = block.match(/name=["']([^"']+)["']/);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    const exprs = [];
    const exprBlocks = block.match(/<expression[^>]*>([\s\S]*?)<\/expression>/g) ?? [];
    for (const eb of exprBlocks) {
      const inner = eb
        .replace(/<\/?expression[^>]*>/g, "")
        .trim()
        .replace(/\s+/g, " ");
      if (inner) exprs.push(inner);
    }
    if (exprs.length) graphs.push({ path: name, alternatives: exprs });
  }
}

const outPath = path.join(__dirname, "../src/lib/plotPresetsData.ts");
const body = `// Auto-generated from UAVLogViewer mavgraphs*.xml — do not edit by hand
import type { PlotPresetGraph } from "./plotPresets";

export const PLOT_PRESET_GRAPHS: PlotPresetGraph[] = ${JSON.stringify(graphs, null, 2)};
`;

fs.writeFileSync(outPath, body);
console.log(`Wrote ${graphs.length} presets to ${outPath}`);

const topLevel = {};
for (const g of graphs) {
  const top = g.path.split("/")[0];
  topLevel[top] = (topLevel[top] ?? 0) + 1;
}
console.log("Categories:", topLevel);
