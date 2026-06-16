import type uPlot from "uplot";

export interface FlightModeSegment {
  startMs: number;
  endMs: number;
  mode: string;
  color: string;
  labelColor: string;
}

export function extractFlightModeChanges(
  timeMs: number[],
  modes: string[],
  logEndMs: number,
  logStartMs = 0,
): FlightModeSegment[] {
  if (timeMs.length === 0 || modes.length === 0 || logEndMs <= logStartMs) return [];

  const len = Math.min(timeMs.length, modes.length);
  const changes: [number, string][] = [];

  for (let i = 0; i < len; i++) {
    const mode = modes[i]?.trim();
    if (!mode) continue;
    if (changes.length === 0 || changes[changes.length - 1]![1] !== mode) {
      changes.push([timeMs[i]!, mode]);
    }
  }

  if (changes.length === 0) return [];

  const colorMap = buildModeColorMap(changes.map((c) => c[1]));
  const endMs = Math.max(logEndMs, changes[changes.length - 1]![0]);

  const segments = changes.map(([startMs, mode], i) => {
    const color = colorMap.get(mode) ?? "#888888";
    return {
      startMs,
      endMs: i + 1 < changes.length ? changes[i + 1]![0] : endMs,
      mode,
      color,
      labelColor: darkenColor(color),
    };
  });

  segments[0]!.startMs = logStartMs;
  return segments;
}

function buildModeColorMap(modes: string[]): Map<string, string> {
  const unique: string[] = [];
  for (const mode of modes) {
    if (!unique.includes(mode)) unique.push(mode);
  }

  const map = new Map<string, string>();
  const count = Math.max(unique.length, 1);
  unique.forEach((mode, i) => {
    const hue = Math.round((i / count) * 360);
    map.set(mode, `hsl(${hue}, 72%, 55%)`);
  });
  return map;
}

function darkenColor(color: string): string {
  const hsl = color.match(/^hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)$/);
  if (hsl) {
    const lightness = Math.max(18, Number(hsl[3]) - 22);
    return `hsl(${hsl[1]}, ${hsl[2]}%, ${lightness}%)`;
  }
  return color;
}

function withAlpha(color: string, alpha: number): string {
  const hsl = color.match(/^hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)$/);
  if (hsl) {
    return `hsla(${hsl[1]}, ${hsl[2]}%, ${hsl[3]}%, ${alpha})`;
  }
  return color;
}

const MIN_BAND_PX = 1;
const MIN_LABEL_PX = 20;
const LABEL_INSET = 6;

export function flightModeAtTime(
  timeMs: number,
  segments: FlightModeSegment[],
): { mode: string; color: string; labelColor: string } | null {
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i]!;
    if (timeMs >= seg.startMs && timeMs <= seg.endMs) {
      return { mode: seg.mode, color: seg.color, labelColor: seg.labelColor };
    }
  }
  return null;
}

function visibleBandGeometry(
  u: uPlot,
  segment: FlightModeSegment,
  viewMin: number,
  viewMax: number,
  left: number,
  plotRight: number,
): { bandLeft: number; bandRight: number; bandWidth: number; labelX: number } | null {
  if (segment.endMs <= viewMin || segment.startMs >= viewMax) return null;

  const x0 = u.valToPos(Math.max(segment.startMs, viewMin), "x", true);
  const x1 = u.valToPos(Math.min(segment.endMs, viewMax), "x", true);
  const bandLeft = Math.max(left, Math.min(x0, x1));
  const bandRight = Math.min(plotRight, Math.max(x0, x1));
  const bandWidth = bandRight - bandLeft;
  if (bandWidth < MIN_BAND_PX) return null;

  const segmentLeft = u.valToPos(segment.startMs, "x", true);
  const labelX = Math.max(left + 2, Math.min(segmentLeft + 2, plotRight - 2));
  return { bandLeft, bandRight, bandWidth, labelX };
}

export function drawFlightModeBands(u: uPlot, segments: FlightModeSegment[]): void {
  if (segments.length === 0) return;

  const xScale = u.scales.x;
  if (xScale?.min == null || xScale?.max == null) return;

  const { left, top, width, height } = u.bbox;
  if (width <= 0 || height <= 0) return;

  const ctx = u.ctx;
  const viewMin = xScale.min;
  const viewMax = xScale.max;
  const plotRight = left + width;

  ctx.save();

  for (const segment of segments) {
    const geom = visibleBandGeometry(u, segment, viewMin, viewMax, left, plotRight);
    if (!geom) continue;

    ctx.fillStyle = withAlpha(segment.color, 0.15);
    ctx.fillRect(geom.bandLeft, top, geom.bandWidth, height);
  }

  ctx.restore();
}

export function drawFlightModeLabels(u: uPlot, segments: FlightModeSegment[]): void {
  if (segments.length === 0) return;

  const xScale = u.scales.x;
  if (xScale?.min == null || xScale?.max == null) return;

  const { left, top, width, height } = u.bbox;
  if (width <= 0 || height <= 0) return;

  const ctx = u.ctx;
  const viewMin = xScale.min;
  const viewMax = xScale.max;
  const plotRight = left + width;
  const plotBottom = top + height;

  ctx.save();

  for (const segment of segments) {
    const geom = visibleBandGeometry(u, segment, viewMin, viewMax, left, plotRight);
    if (!geom || geom.bandWidth < MIN_LABEL_PX) continue;

    ctx.fillStyle = segment.labelColor;
    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    ctx.save();
    ctx.translate(geom.labelX, plotBottom - LABEL_INSET);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(segment.mode, 0, 0);
    ctx.restore();
  }

  ctx.restore();
}
