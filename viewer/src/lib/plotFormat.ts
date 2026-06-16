import type { ActivePlot } from "../stores/plotStore";

export function formatPlotLabel(plot: ActivePlot): string {
  const type =
    plot.instance !== undefined
      ? `${plot.messageType}[${plot.instance}]`
      : plot.messageType;
  return `${type}.${plot.field}`.toUpperCase();
}

export function formatAxisFieldLabels(plots: ActivePlot[], yAxis: 1 | 2): string {
  return plots.filter((p) => p.yAxis === yAxis).map(formatPlotLabel).join(", ");
}

export function formatDurationMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
}

export interface SeriesStats {
  min: number;
  max: number;
  mean: number;
}

export function computeSeriesStats(values: number[]): SeriesStats {
  if (values.length === 0) {
    return { min: 0, max: 0, mean: 0 };
  }
  let min = values[0]!;
  let max = values[0]!;
  let sum = 0;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  return { min, max, mean: sum / values.length };
}

export function formatStatValue(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1000) return value.toFixed(1);
  if (abs >= 10) return value.toFixed(2);
  if (abs >= 1) return value.toFixed(3);
  return value.toFixed(4);
}
