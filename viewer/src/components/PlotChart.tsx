import {
  Box,
  Button,
  Center,
  Group,
  Loader,
  Stack,
  Text,
  useComputedColorScheme,
} from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
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
  const [legendLeft, setLegendLeft] = useState(58);
  const [cursorTip, setCursorTip] = useState<CursorTipState | null>(null);

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

    const opts: uPlot.Options = {
      width,
      height,
      pxAlign: 1,
      legend: { show: false },
      scales: {
        x: { time: false, range: xRange },
        y: { auto: true },
        ...(hasY2 ? { y2: { auto: true } } : {}),
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
        drag: { x: true, y: false },
        x: true,
        y: false,
        points: { show: false },
      },
      hooks: {
        ready: [
          (u) => {
            syncLegendLeft(u);
            u.over.addEventListener("mouseenter", () => {
              mouseOnChartRef.current = true;
            });
            u.over.addEventListener("mouseleave", () => {
              mouseOnChartRef.current = false;
              setCursorTip(null);
              if (!suppressCursorHookRef.current) {
                timeStoreApi.getState().setHoveredTimeMs(null);
              }
            });
          },
        ],
        draw: [(u) => syncLegendLeft(u)],
        setCursor: [
          (u) => {
            if (suppressCursorHookRef.current) return;

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
        setSelect: [
          (u) => {
            const left = u.select.left;
            const widthSel = u.select.width;
            if (widthSel > 0) {
              const x0 = u.posToVal(left, "x");
              const x1 = u.posToVal(left + widthSel, "x");
              timeStoreApi.getState().setTimeRange([x0, x1]);
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
    plot.setData(chartData.data as uPlot.AlignedData, true);
  }, [chartData]);

  useEffect(() => {
    const plot = plotRef.current;
    if (!plot || !chartData) return;
    const xRange = timeRange ?? [chartData.xMin, chartData.xMax];
    plot.setScale("x", { min: xRange[0], max: xRange[1] });
  }, [timeRange, chartData]);

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
      <Box flex={1} mih={180} pos="relative" bg={plotBg}>
        {chartData ? (
          <>
            <Box ref={containerRef} w="100%" h="100%" className="uplot-host" />
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
