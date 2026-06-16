import { useCallback, useEffect, useMemo, useRef } from "react";
import { IconDownload } from "@tabler/icons-react";
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
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { usePlotSeriesData } from "../hooks/useFieldSeries";
import { decimateMinMax } from "../lib/decimate";
import { downloadCsv, exportSeriesToCsv } from "../lib/csvExport";
import { usePlotStore } from "../stores/plotStore";
import { useTimeStore, timeStoreApi } from "../stores/timeStore";
import { useSessionStore } from "../stores/sessionStore";

function buildChartData(seriesData: ReturnType<typeof usePlotSeriesData>) {
  const withData = seriesData.filter((s) => s.timeMs && s.values && s.timeMs.length > 0);
  if (withData.length === 0) {
    return null;
  }

  const first = withData[0]!;
  const n = Math.min(first.timeMs!.length, first.values!.length);
  const { x } = decimateMinMax(first.timeMs!.slice(0, n), first.values!.slice(0, n));

  const seriesMeta: { color: string; scale: string; label: string }[] = [];
  const data: number[][] = [x];

  for (const { plot, timeMs, values } of withData) {
    const len = Math.min(timeMs!.length, values!.length, n);
    const { y } = decimateMinMax(timeMs!.slice(0, len), values!.slice(0, len), x.length * 2);
    const scale = plot.yAxis === 2 ? "y2" : "y";
    seriesMeta.push({ color: plot.color, scale, label: plot.id });
    data.push(y.slice(0, x.length));
  }

  return { data, seriesMeta, xMin: x[0]!, xMax: x[x.length - 1]! };
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

  const isDark = computedColorScheme === "dark";
  const gridColor = isDark ? "#3a4558" : "#d4d4d8";
  const textColor = isDark ? "#e8eaed" : "#18181b";
  const plotBg = isDark ? "#0f1218" : "#f8f8f8";

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
          label: "time_boot_ms",
        },
        {
          stroke: textColor,
          grid: { stroke: gridColor },
          ticks: { stroke: gridColor },
          label: "Y1",
          size: 50,
        },
        ...(hasY2
          ? [
              {
                stroke: textColor,
                grid: { show: false },
                ticks: { stroke: gridColor },
                label: "Y2",
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
      },
      hooks: {
        setCursor: [
          (u) => {
            if (suppressCursorHookRef.current) return;
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
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      plot.destroy();
      plotRef.current = null;
    };
    // chartData read for initial mount; ongoing updates use setData/setScale effects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasChartData, plotSignature, gridColor, textColor]);

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
        top: plot.bbox.top + plot.bbox.height / 2,
      },
      false,
    );
    plot.setLegend({ idx: bestIdx }, false);
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
              {activePlots.length} series · uPlot · time_boot_ms
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
          <Box ref={containerRef} w="100%" h="100%" className="uplot-host" />
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
