import {
  ActionIcon,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Stack,
  Text,
  Tooltip,
  useComputedColorScheme,
} from "@mantine/core";
import {
  IconArrowsMaximize,
  IconArrowsMove,
  IconDownload,
  IconZoomIn,
  IconZoomOut,
  IconZoomScan,
} from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { usePlotSeriesData } from "../hooks/useFieldSeries";
import { downloadCsv, exportSeriesToCsv } from "../lib/csvExport";
import { decimateMinMax } from "../lib/decimate";
import {
  computeSeriesStats,
  formatAxisFieldLabels,
  formatDurationMs,
  formatPlotLabel,
  formatStatValue,
} from "../lib/plotFormat";
import { usePlotStore } from "../stores/plotStore";
import { useSessionStore } from "../stores/sessionStore";
import { timeStoreApi, useTimeStore } from "../stores/timeStore";

interface CursorTipRow {
  label: string;
  color: string;
  value: string;
}

interface CursorTipState {
  x: number;
  y: number;
  time: string;
  rows: CursorTipRow[];
}

type ChartTool = "zoom" | "pan";

function effectiveDragAction(tool: ChartTool, shiftKey: boolean): ChartTool {
  return shiftKey ? (tool === "zoom" ? "pan" : "zoom") : tool;
}

interface YRangeState {
  y?: [number, number];
  y2?: [number, number];
}

const ZOOM_STEP = 1.25;

function scaleRange([min, max]: [number, number], factor: number): [number, number] {
  const center = (min + max) / 2;
  const half = ((max - min) / 2) * factor;
  return [center - half, center + half];
}

function readScaleRange(scale: uPlot.Scale | undefined): [number, number] | null {
  if (scale?.min == null || scale?.max == null) return null;
  return [scale.min, scale.max];
}

function dataRangeForScale(plot: uPlot, scaleKey: string): [number, number] | null {
  let min = Infinity;
  let max = -Infinity;

  for (let si = 1; si < plot.series.length; si++) {
    const series = plot.series[si]!;
    if (series.scale !== scaleKey) continue;
    const values = plot.data[si];
    if (!values) continue;
    for (const v of values) {
      if (v == null || !Number.isFinite(v)) continue;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  if (min === max) {
    const pad = Math.abs(min) > 1 ? Math.abs(min) * 0.05 : 1;
    return [min - pad, max + pad];
  }
  return [min, max];
}

function readYRangeFromPlot(u: uPlot, hasY2: boolean): YRangeState {
  const result: YRangeState = {};
  const y = readScaleRange(u.scales.y);
  if (y) result.y = y;
  if (hasY2) {
    const y2 = readScaleRange(u.scales.y2);
    if (y2) result.y2 = y2;
  }
  return result;
}

function applyZoomRect(
  u: uPlot,
  rect: { left: number; top: number; width: number; height: number },
  data: NonNullable<ReturnType<typeof buildChartData>>,
  setTimeRange: (range: [number, number] | null) => void,
  setYRange: (range: YRangeState | null) => void,
) {
  if (rect.width < 3 || rect.height < 3) return;

  const x0 = u.posToVal(rect.left, "x");
  const x1 = u.posToVal(rect.left + rect.width, "x");
  const y0 = u.posToVal(rect.top, "y");
  const y1 = u.posToVal(rect.top + rect.height, "y");

  const xMin = Math.min(x0, x1);
  const xMax = Math.max(x0, x1);
  const yMin = Math.min(y0, y1);
  const yMax = Math.max(y0, y1);

  const hasY2 = data.seriesMeta.some((s) => s.scale === "y2");
  const nextY: YRangeState = { y: [yMin, yMax] };

  if (hasY2 && u.scales.y2) {
    const y2_0 = u.posToVal(rect.top, "y2");
    const y2_1 = u.posToVal(rect.top + rect.height, "y2");
    nextY.y2 = [Math.min(y2_0, y2_1), Math.max(y2_0, y2_1)];
  }

  u.batch(() => {
    u.setScale("x", { min: xMin, max: xMax });
    u.setScale("y", { min: yMin, max: yMax });
    if (nextY.y2) u.setScale("y2", { min: nextY.y2[0], max: nextY.y2[1] });
  });

  setTimeRange([xMin, xMax]);
  setYRange(nextY);
}

function buildChartData(seriesData: ReturnType<typeof usePlotSeriesData>) {
  const withData = seriesData.filter((s) => s.timeMs && s.values && s.timeMs.length > 0);
  if (withData.length === 0) {
    return null;
  }

  let globalMaxTime = 0;
  let refSeries = withData[0]!;
  let refLen = 0;

  for (const s of withData) {
    const last = s.timeMs![s.timeMs!.length - 1]!;
    if (last > globalMaxTime) globalMaxTime = last;
    if (s.timeMs!.length > refLen) {
      refLen = s.timeMs!.length;
      refSeries = s;
    }
  }

  const n = Math.min(refSeries.timeMs!.length, refSeries.values!.length);
  const { x } = decimateMinMax(refSeries.timeMs!.slice(0, n), refSeries.values!.slice(0, n));

  const seriesMeta: { color: string; scale: string; label: string }[] = [];
  const data: number[][] = [x];

  for (const { plot, timeMs, values } of withData) {
    const len = Math.min(timeMs!.length, values!.length);
    const { y } = decimateMinMax(timeMs!.slice(0, len), values!.slice(0, len), x.length * 2);
    const scale = plot.yAxis === 2 ? "y2" : "y";
    seriesMeta.push({ color: plot.color, scale, label: formatPlotLabel(plot) });
    data.push(y.slice(0, x.length));
  }

  return { data, seriesMeta, xMin: 0, xMax: globalMaxTime };
}

function seriesLabel(label: uPlot.Series["label"]): string {
  return typeof label === "string" ? label : "";
}

function seriesColor(stroke: uPlot.Series["stroke"], fallback: string): string {
  return typeof stroke === "string" ? stroke : fallback;
}

function readCursorTip(u: uPlot): CursorTipState | null {
  const idx = u.cursor.idx;
  const left = u.cursor.left;
  if (idx == null || left == null) return null;

  const t = u.data[0]?.[idx];
  const rows: CursorTipRow[] = [];

  for (let si = 1; si < u.series.length; si++) {
    const v = u.data[si]?.[idx];
    if (v == null || !Number.isFinite(v)) continue;
    const series = u.series[si]!;
    rows.push({
      label: seriesLabel(series.label),
      color: seriesColor(series.stroke, "#888"),
      value: formatStatValue(v),
    });
  }

  const tipWidth = 168;
  const offset = 10;
  const anchorX = u.bbox.left + left;
  const plotRight = u.bbox.left + u.bbox.width;
  const flip = anchorX + offset + tipWidth > plotRight;
  const x = flip ? anchorX - tipWidth - offset : anchorX + offset;
  const y = Math.max(
    u.bbox.top + 4,
    Math.min(u.bbox.top + (u.cursor.top ?? u.bbox.height / 2), u.bbox.top + u.bbox.height - 4),
  );

  return {
    x,
    y,
    time: typeof t === "number" ? formatDurationMs(t) : "",
    rows,
  };
}

export function PlotChart() {
  const activePlots = usePlotStore((s) => s.activePlots);
  const seriesData = usePlotSeriesData(activePlots);
  const summary = useSessionStore((s) => s.summary);
  const hoveredTimeMs = useTimeStore((s) => s.hoveredTimeMs);
  const timeRange = useTimeStore((s) => s.timeRange);
  const setLogDurationMs = useTimeStore((s) => s.setLogDurationMs);
  const computedColorScheme = useComputedColorScheme("dark");

  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);
  const suppressCursorHookRef = useRef(false);
  const mouseOnChartRef = useRef(false);
  const chartToolRef = useRef<ChartTool>("zoom");
  const yRangeRef = useRef<YRangeState | null>(null);
  const chartDataRef = useRef<ReturnType<typeof buildChartData>>(null);
  const panRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    xRange: [number, number];
    yRange: YRangeState;
  } | null>(null);
  const zoomDragRef = useRef<{ startX: number; startY: number } | null>(null);
  const plotCleanupRef = useRef<(() => void) | null>(null);
  const [legendLeft, setLegendLeft] = useState(58);
  const [plotBbox, setPlotBbox] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [zoomRect, setZoomRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [cursorTip, setCursorTip] = useState<CursorTipState | null>(null);
  const [chartTool, setChartTool] = useState<ChartTool>("zoom");
  const [shiftHeld, setShiftHeld] = useState(false);
  const [yRange, setYRange] = useState<YRangeState | null>(null);
  const setTimeRange = useTimeStore((s) => s.setTimeRange);

  chartToolRef.current = chartTool;
  yRangeRef.current = yRange;

  const effectiveTool = effectiveDragAction(chartTool, shiftHeld);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftHeld(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftHeld(false);
    };
    const onBlur = () => setShiftHeld(false);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const syncLegendLeft = useCallback((plot: uPlot) => {
    const next = plot.bbox.left + 8;
    setLegendLeft((prev) => (prev === next ? prev : next));
  }, []);

  const isDark = computedColorScheme === "dark";
  const gridColor = isDark ? "#3a4558" : "#d4d4d8";
  const textColor = isDark ? "#e8eaed" : "#18181b";
  const plotBg = isDark ? "#0f1218" : "#f8f8f8";
  const legendBg = isDark ? "rgba(15, 18, 24, 0.88)" : "rgba(248, 248, 248, 0.92)";
  const tipBg = isDark ? "rgba(20, 24, 32, 0.95)" : "rgba(255, 255, 255, 0.96)";
  const tipBorder = isDark ? "#3a4558" : "#d4d4d8";

  const anyLoading = seriesData.some((s) => s.isLoading);
  const anyError = seriesData.some((s) => s.isError);
  const firstError = seriesData.find((s) => s.errorMessage)?.errorMessage;
  const hasNumericData = seriesData.some((s) => s.timeMs && s.values);

  const plotSignature = activePlots.map((p) => `${p.id}:${p.color}:${p.yAxis}`).join("|");

  useEffect(() => {
    let maxTime = 0;
    for (const s of seriesData) {
      if (s.timeMs && s.timeMs.length > 0) {
        const last = s.timeMs[s.timeMs.length - 1]!;
        if (last > maxTime) maxTime = last;
      }
    }
    if (maxTime > 0) {
      setLogDurationMs(maxTime);
    }
  }, [seriesData, setLogDurationMs]);

  const chartData = useMemo(() => buildChartData(seriesData), [seriesData]);
  const hasChartData = chartData !== null;
  chartDataRef.current = chartData;

  const legendItems = useMemo(
    () =>
      seriesData
        .filter((s) => s.values && s.values.length > 0)
        .map((s) => ({
          plot: s.plot,
          label: formatPlotLabel(s.plot),
          stats: computeSeriesStats(s.values!),
        })),
    [seriesData],
  );

  const y1Label = useMemo(() => formatAxisFieldLabels(activePlots, 1), [activePlots]);
  const y2Label = useMemo(() => formatAxisFieldLabels(activePlots, 2), [activePlots]);

  const handleExportCsv = useCallback(() => {
    const csvSeries = seriesData
      .filter((s) => s.timeMs && s.values)
      .map((s) => ({
        id: s.plot.id,
        timeMs: s.timeMs!,
        values: s.values!,
      }));
    if (csvSeries.length === 0) return;
    const content = exportSeriesToCsv(csvSeries);
    const baseName = summary?.fileName?.replace(/\.[^.]+$/, "") ?? "log";
    downloadCsv(content, `${baseName}_plot.csv`);
  }, [seriesData, summary]);

  const zoomVisible = useCallback(
    (factor: number) => {
      const plot = plotRef.current;
      const data = chartDataRef.current;
      if (!plot || !data) return;

      const xScale = plot.scales.x;
      if (xScale?.min == null || xScale?.max == null) return;

      const xNext = scaleRange([xScale.min, xScale.max], factor);
      const currentY = readYRangeFromPlot(plot, data.seriesMeta.some((s) => s.scale === "y2"));
      const nextY: YRangeState = {};

      plot.batch(() => {
        plot.setScale("x", { min: xNext[0], max: xNext[1] });
        if (currentY.y) {
          nextY.y = scaleRange(currentY.y, factor);
          plot.setScale("y", { min: nextY.y[0], max: nextY.y[1] });
        }
        if (currentY.y2) {
          nextY.y2 = scaleRange(currentY.y2, factor);
          plot.setScale("y2", { min: nextY.y2[0], max: nextY.y2[1] });
        }
      });

      setTimeRange(xNext);
      if (nextY.y || nextY.y2) setYRange(nextY);
    },
    [setTimeRange],
  );

  const handleAutoscale = useCallback(() => {
    const plot = plotRef.current;
    const data = chartDataRef.current;
    if (!plot || !data) {
      setTimeRange(null);
      setYRange(null);
      return;
    }

    const hasY2 = data.seriesMeta.some((s) => s.scale === "y2");
    plot.batch(() => {
      plot.setScale("x", { min: data.xMin, max: data.xMax });
      const autoY = dataRangeForScale(plot, "y");
      if (autoY) plot.setScale("y", { min: autoY[0], max: autoY[1] });
      if (hasY2) {
        const autoY2 = dataRangeForScale(plot, "y2");
        if (autoY2) plot.setScale("y2", { min: autoY2[0], max: autoY2[1] });
      }
    });

    setTimeRange(null);
    setYRange(null);
  }, [setTimeRange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !chartData) {
      plotRef.current?.destroy();
      plotRef.current = null;
      setCursorTip(null);
      return;
    }

    const hasY2 = chartData.seriesMeta.some((s) => s.scale === "y2");
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 280;
    const xRange = timeRange ?? [chartData.xMin, chartData.xMax];
    const currentYRange = yRangeRef.current;

    const opts: uPlot.Options = {
      width,
      height,
      pxAlign: 1,
      legend: { show: false },
      scales: {
        x: { time: false, min: xRange[0], max: xRange[1] },
        y: currentYRange?.y ? { auto: false, min: currentYRange.y[0], max: currentYRange.y[1] } : { auto: true },
        ...(hasY2
          ? {
            y2: currentYRange?.y2
              ? { auto: false, min: currentYRange.y2[0], max: currentYRange.y2[1] }
              : { auto: true },
          }
          : {}),
      },
      axes: [
        {
          stroke: textColor,
          grid: { stroke: gridColor },
          ticks: { stroke: gridColor },
          values: (_u, splits) => splits.map((v) => formatDurationMs(v)),
        },
        {
          stroke: textColor,
          grid: { stroke: gridColor },
          ticks: { stroke: gridColor },
          label: y1Label,
          size: 50,
        },
        ...(hasY2
          ? [
            {
              stroke: textColor,
              grid: { show: false },
              ticks: { stroke: gridColor },
              label: y2Label,
              side: 1 as const,
              scale: "y2",
              size: 50,
            },
          ]
          : []),
      ],
      series: [
        { label: "time" },
        ...chartData.seriesMeta.map((s) => ({
          label: s.label,
          stroke: s.color,
          width: 1.5,
          scale: s.scale,
        })),
      ],
      cursor: {
        drag: { setScale: false, x: false, y: false },
        x: true,
        y: false,
        points: { show: false },
      },
      hooks: {
        ready: [
          (u) => {
            syncLegendLeft(u);
            const over = u.over;

            const syncBbox = () => {
              const { left, top, width: w, height: h } = u.bbox;
              setPlotBbox((prev) =>
                prev.left === left && prev.top === top && prev.width === w && prev.height === h
                  ? prev
                  : { left, top, width: w, height: h },
              );
            };
            syncBbox();

            const finishZoomDrag = (e: MouseEvent) => {
              const start = zoomDragRef.current;
              if (!start) return;

              const rect = over.getBoundingClientRect();
              const offsetX = e.clientX - rect.left;
              const offsetY = e.clientY - rect.top;
              const left = Math.min(start.startX, offsetX);
              const top = Math.min(start.startY, offsetY);
              const width = Math.abs(offsetX - start.startX);
              const height = Math.abs(offsetY - start.startY);

              zoomDragRef.current = null;
              setZoomRect(null);

              const data = chartDataRef.current;
              if (data) {
                applyZoomRect(u, { left, top, width, height }, data, (range) => {
                  timeStoreApi.getState().setTimeRange(range);
                }, setYRange);
              }
            };

            over.addEventListener("mouseenter", () => {
              mouseOnChartRef.current = true;
            });
            over.addEventListener("mouseleave", () => {
              mouseOnChartRef.current = false;
              setCursorTip(null);
              if (!suppressCursorHookRef.current) {
                timeStoreApi.getState().setHoveredTimeMs(null);
              }
            });

            over.addEventListener("mousedown", (e) => {
              if (e.button !== 0) return;

              const action = effectiveDragAction(chartToolRef.current, e.shiftKey);

              if (action === "zoom") {
                zoomDragRef.current = { startX: e.offsetX, startY: e.offsetY };
                setZoomRect({ left: e.offsetX, top: e.offsetY, width: 0, height: 0 });
                return;
              }

              const xScale = u.scales.x;
              if (xScale?.min == null || xScale?.max == null) return;

              panRef.current = {
                active: true,
                startX: e.offsetX,
                startY: e.offsetY,
                xRange: [xScale.min, xScale.max],
                yRange: readYRangeFromPlot(u, u.scales.y2 != null),
              };
              over.classList.add("u-panning");
            });

            const endPan = () => {
              if (!panRef.current?.active) return;
              panRef.current = null;
              over.classList.remove("u-panning");
            };

            const onMouseUp = (e: MouseEvent) => {
              if (zoomDragRef.current) finishZoomDrag(e);
              endPan();
            };

            over.addEventListener("mouseup", onMouseUp);
            document.addEventListener("mouseup", onMouseUp);

            over.addEventListener("mouseleave", () => {
              if (!zoomDragRef.current) endPan();
            });

            over.addEventListener("mousemove", (e) => {
              const zoomStart = zoomDragRef.current;
              if (zoomStart) {
                const left = Math.min(zoomStart.startX, e.offsetX);
                const top = Math.min(zoomStart.startY, e.offsetY);
                const width = Math.abs(e.offsetX - zoomStart.startX);
                const height = Math.abs(e.offsetY - zoomStart.startY);
                setZoomRect({ left, top, width, height });
                return;
              }

              const pan = panRef.current;
              if (!pan?.active) return;

              const dx = u.posToVal(pan.startX, "x") - u.posToVal(e.offsetX, "x");
              const dy = u.posToVal(pan.startY, "y") - u.posToVal(e.offsetY, "y");

              const xNext: [number, number] = [pan.xRange[0] + dx, pan.xRange[1] + dx];
              u.setScale("x", { min: xNext[0], max: xNext[1] });
              timeStoreApi.getState().setTimeRange(xNext);

              const nextY: YRangeState = {};
              if (pan.yRange.y) {
                nextY.y = [pan.yRange.y[0] + dy, pan.yRange.y[1] + dy];
                u.setScale("y", { min: nextY.y[0], max: nextY.y[1] });
              }
              if (pan.yRange.y2) {
                const dy2 = u.posToVal(pan.startY, "y2") - u.posToVal(e.offsetY, "y2");
                nextY.y2 = [pan.yRange.y2[0] + dy2, pan.yRange.y2[1] + dy2];
                u.setScale("y2", { min: nextY.y2[0], max: nextY.y2[1] });
              }
              if (nextY.y || nextY.y2) setYRange(nextY);
            });

            over.addEventListener(
              "wheel",
              (e) => {
                e.preventDefault();
                const xScale = u.scales.x;
                const yScale = u.scales.y;
                if (xScale?.min == null || xScale?.max == null) return;

                const factor = e.deltaY < 0 ? 1 / ZOOM_STEP : ZOOM_STEP;
                const anchorX = u.posToVal(e.offsetX, "x");
                const xMin = anchorX - (anchorX - xScale.min) * factor;
                const xMax = anchorX + (xScale.max - anchorX) * factor;

                const updates: Array<() => void> = [
                  () => u.setScale("x", { min: xMin, max: xMax }),
                ];

                if (yScale?.min != null && yScale?.max != null) {
                  const anchorY = u.posToVal(e.offsetY, "y");
                  const yMin = anchorY - (anchorY - yScale.min) * factor;
                  const yMax = anchorY + (yScale.max - anchorY) * factor;
                  updates.push(() => u.setScale("y", { min: yMin, max: yMax }));
                }

                const y2Scale = u.scales.y2;
                let y2Next: [number, number] | null = null;
                if (y2Scale?.min != null && y2Scale?.max != null) {
                  const anchorY2 = u.posToVal(e.offsetY, "y2");
                  y2Next = [
                    anchorY2 - (anchorY2 - y2Scale.min) * factor,
                    anchorY2 + (y2Scale.max - anchorY2) * factor,
                  ];
                  updates.push(() => u.setScale("y2", { min: y2Next![0], max: y2Next![1] }));
                }

                u.batch(() => {
                  for (const fn of updates) fn();
                });

                timeStoreApi.getState().setTimeRange([xMin, xMax]);

                const nextY: YRangeState = {};
                if (yScale?.min != null && yScale?.max != null) {
                  const anchorY = u.posToVal(e.offsetY, "y");
                  nextY.y = [
                    anchorY - (anchorY - yScale.min) * factor,
                    anchorY + (yScale.max - anchorY) * factor,
                  ];
                }
                if (y2Next) nextY.y2 = y2Next;
                if (nextY.y || nextY.y2) setYRange(nextY);
              },
              { passive: false },
            );

            plotCleanupRef.current = () => {
              document.removeEventListener("mouseup", onMouseUp);
            };
          },
        ],
        draw: [
          (u) => {
            syncLegendLeft(u);
            const { left, top, width: w, height: h } = u.bbox;
            setPlotBbox((prev) =>
              prev.left === left && prev.top === top && prev.width === w && prev.height === h
                ? prev
                : { left, top, width: w, height: h },
            );
          },
        ],
        setCursor: [
          (u) => {
            if (suppressCursorHookRef.current || zoomDragRef.current || panRef.current?.active) return;

            setCursorTip(readCursorTip(u));

            const idx = u.cursor.idx;
            if (idx != null && u.data[0]) {
              const t = u.data[0][idx];
              if (typeof t === "number") {
                timeStoreApi.getState().setHoveredTimeMs(t);
              }
            }
          },
        ],
      },
    };

    plotRef.current?.destroy();
    const plot = new uPlot(opts, chartData.data as uPlot.AlignedData, container);
    plotRef.current = plot;

    const ro = new ResizeObserver(() => {
      plot.setSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
      syncLegendLeft(plot);
    });
    ro.observe(container);

    return () => {
      plotCleanupRef.current?.();
      plotCleanupRef.current = null;
      zoomDragRef.current = null;
      setZoomRect(null);
      ro.disconnect();
      plot.destroy();
      plotRef.current = null;
    };
    // chartData read for initial mount; ongoing updates use setData/setScale effects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasChartData, plotSignature, gridColor, textColor, y1Label, y2Label, syncLegendLeft]);

  useEffect(() => {
    const plot = plotRef.current;
    if (!plot || !chartData) return;
    plot.setData(chartData.data as uPlot.AlignedData, false);
  }, [chartData]);

  useEffect(() => {
    const plot = plotRef.current;
    if (!plot || !chartData) return;
    const xRange = timeRange ?? [chartData.xMin, chartData.xMax];
    const xScale = plot.scales.x;
    if (xScale?.min === xRange[0] && xScale?.max === xRange[1]) return;
    plot.setScale("x", { min: xRange[0], max: xRange[1] });
  }, [timeRange, chartData]);

  useEffect(() => {
    const plot = plotRef.current;
    if (!plot || !chartData || !yRange) return;

    if (yRange.y) {
      const yScale = plot.scales.y;
      if (yScale?.min !== yRange.y[0] || yScale?.max !== yRange.y[1]) {
        plot.setScale("y", { min: yRange.y[0], max: yRange.y[1] });
      }
    }

    if (yRange.y2) {
      const y2Scale = plot.scales.y2;
      if (y2Scale?.min !== yRange.y2[0] || y2Scale?.max !== yRange.y2[1]) {
        plot.setScale("y2", { min: yRange.y2[0], max: yRange.y2[1] });
      }
    }
  }, [yRange, chartData]);

  useEffect(() => {
    const plot = plotRef.current;
    if (!plot || hoveredTimeMs === null) return;
    // Chart drives its own cursor while the mouse is over it.
    if (mouseOnChartRef.current) return;

    const x = plot.data[0];
    if (!x) return;

    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < x.length; i++) {
      const dist = Math.abs((x[i] as number) - hoveredTimeMs);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    const xVal = x[bestIdx] as number;
    suppressCursorHookRef.current = true;
    plot.setCursor(
      {
        left: plot.valToPos(xVal, "x"),
        top: plot.bbox.height / 2,
      },
      false,
    );
    suppressCursorHookRef.current = false;
  }, [hoveredTimeMs]);

  if (activePlots.length === 0) {
    return (
      <Center flex={1} p="xl">
        <Stack align="center" gap="xs">
          <Text c="dimmed">Time-series plot area</Text>
          <Text size="sm" c="dimmed">
            Click a field in the Plot tab to add a series.
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Box style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Group
        justify="space-between"
        px="sm"
        py={6}
        style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
      >
        <Group gap={6}>
          {anyLoading && (
            <>
              <Loader size={14} type="oval" />
              <Text size="xs" c="dimmed">
                Loading series…
              </Text>
            </>
          )}
          {!anyLoading && hasNumericData && (
            <Text size="xs" c="dimmed">
              {activePlots.length} series
            </Text>
          )}
        </Group>
        <Group gap={4}>
          <Tooltip label="Zoom (drag rectangle)">
            <ActionIcon
              variant={chartTool === "zoom" ? "filled" : "default"}
              size="sm"
              aria-label="Zoom"
              onClick={() => setChartTool("zoom")}
              disabled={!hasNumericData}
            >
              <IconZoomScan size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Pan (drag to move)">
            <ActionIcon
              variant={chartTool === "pan" ? "filled" : "default"}
              size="sm"
              aria-label="Pan"
              onClick={() => setChartTool("pan")}
              disabled={!hasNumericData}
            >
              <IconArrowsMove size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Zoom in">
            <ActionIcon
              variant="default"
              size="sm"
              aria-label="Zoom in"
              onClick={() => zoomVisible(1 / ZOOM_STEP)}
              disabled={!hasNumericData}
            >
              <IconZoomIn size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Zoom out">
            <ActionIcon
              variant="default"
              size="sm"
              aria-label="Zoom out"
              onClick={() => zoomVisible(ZOOM_STEP)}
              disabled={!hasNumericData}
            >
              <IconZoomOut size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Autoscale (fit all data)">
            <ActionIcon
              variant="default"
              size="sm"
              aria-label="Autoscale"
              onClick={handleAutoscale}
              disabled={!hasNumericData}
            >
              <IconArrowsMaximize size={16} />
            </ActionIcon>
          </Tooltip>
          <Button
            variant="default"
            size="compact-xs"
            leftSection={<IconDownload size={14} />}
            onClick={handleExportCsv}
            disabled={!hasNumericData}
            title="Export visible series to CSV"
          >
            CSV
          </Button>
        </Group>
      </Group>
      <Box flex={1} mih={180} pos="relative" bg={plotBg}>
        {chartData ? (
          <>
            <Box
              ref={containerRef}
              w="100%"
              h="100%"
              className={`uplot-host uplot-host--${effectiveTool}`}
            />
            {zoomRect && plotBbox.width > 0 && plotBbox.height > 0 && (
              <Box className="plot-zoom-overlay" pos="absolute" inset={0} style={{ zIndex: 4, pointerEvents: "none" }}>
                <Box
                  className="plot-zoom-shade"
                  pos="absolute"
                  style={{
                    left: plotBbox.left,
                    top: plotBbox.top,
                    width: plotBbox.width,
                    height: zoomRect.top,
                  }}
                />
                <Box
                  className="plot-zoom-shade"
                  pos="absolute"
                  style={{
                    left: plotBbox.left,
                    top: plotBbox.top + zoomRect.top + zoomRect.height,
                    width: plotBbox.width,
                    height: Math.max(0, plotBbox.height - zoomRect.top - zoomRect.height),
                  }}
                />
                <Box
                  className="plot-zoom-shade"
                  pos="absolute"
                  style={{
                    left: plotBbox.left,
                    top: plotBbox.top + zoomRect.top,
                    width: zoomRect.left,
                    height: zoomRect.height,
                  }}
                />
                <Box
                  className="plot-zoom-shade"
                  pos="absolute"
                  style={{
                    left: plotBbox.left + zoomRect.left + zoomRect.width,
                    top: plotBbox.top + zoomRect.top,
                    width: Math.max(0, plotBbox.width - zoomRect.left - zoomRect.width),
                    height: zoomRect.height,
                  }}
                />
                <Box
                  className="plot-zoom-selection"
                  pos="absolute"
                  style={{
                    left: plotBbox.left + zoomRect.left,
                    top: plotBbox.top + zoomRect.top,
                    width: zoomRect.width,
                    height: zoomRect.height,
                  }}
                />
              </Box>
            )}
            {cursorTip && (
              <Box
                className="plot-cursor-tip"
                style={{
                  position: "absolute",
                  left: cursorTip.x,
                  top: cursorTip.y,
                  transform: "translateY(-50%)",
                  zIndex: 3,
                  pointerEvents: "none",
                  padding: "6px 8px",
                  borderRadius: 4,
                  border: `1px solid ${tipBorder}`,
                  background: tipBg,
                  minWidth: 140,
                  maxWidth: 220,
                  boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.12)",
                }}
              >
                <Text size="xs" fw={600} c={textColor} mb={4} ff="monospace">
                  {cursorTip.time}
                </Text>
                <Stack gap={3}>
                  {cursorTip.rows.map((row) => (
                    <Group key={row.label} gap={6} wrap="nowrap" align="center">
                      <Box
                        w={10}
                        h={3}
                        style={{ backgroundColor: row.color, flexShrink: 0 }}
                      />
                      <Text size="xs" c={textColor} ff="monospace" style={{ lineHeight: 1.2 }}>
                        {row.label}{" "}
                        <Text span fw={600}>
                          {row.value}
                        </Text>
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Box>
            )}
            {legendItems.length > 0 && (
              <Stack
                gap={4}
                className="plot-legend-overlay"
                style={{
                  position: "absolute",
                  top: 8,
                  left: legendLeft,
                  zIndex: 2,
                  pointerEvents: "none",
                  padding: "6px 8px",
                  borderRadius: 4,
                  background: legendBg,
                  maxWidth: `calc(100% - ${legendLeft + 8}px)`,
                }}
              >
                {legendItems.map(({ plot, label, stats }) => (
                  <Group key={plot.id} gap={6} wrap="nowrap" align="center">
                    <Box
                      w={14}
                      h={3}
                      style={{ backgroundColor: plot.color, flexShrink: 0 }}
                    />
                    <Text size="xs" c={textColor} style={{ lineHeight: 1.3 }}>
                      {label} | Min: {formatStatValue(stats.min)} Max:{" "}
                      {formatStatValue(stats.max)} Mean: {formatStatValue(stats.mean)}
                    </Text>
                  </Group>
                ))}
              </Stack>
            )}
          </>
        ) : (
          <Center h="100%" p="xl">
            <Stack align="center" gap="xs">
              {anyLoading ? (
                <Text c="dimmed">Loading plot data…</Text>
              ) : anyError ? (
                <>
                  <Text c="dimmed">Failed to load plot data</Text>
                  <Text size="sm" c="dimmed">
                    {firstError ?? "Unknown error"}
                  </Text>
                </>
              ) : (
                <>
                  <Text c="dimmed">No numeric data to plot</Text>
                  <Text size="sm" c="dimmed">
                    Selected fields may be text-only.
                  </Text>
                </>
              )}
            </Stack>
          </Center>
        )}
      </Box>
    </Box>
  );
}
