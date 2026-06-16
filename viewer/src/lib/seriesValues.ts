import type { FieldSeries } from "../platform/types";

export const TIME_FIELD = "TimeUS";

/** ArduPilot stores Lat/Lng as degrees × 1e7. */
export const GPS_COORD_SCALE = 1e-7;

export function gpsCoordToDegrees(values: number[]): number[] {
  if (values.length === 0) return values;
  const needsScale = values.some((v) => Math.abs(v) > 180);
  return needsScale ? values.map((v) => v * GPS_COORD_SCALE) : values;
}

export function timeUsToBootMs(values: number[]): number[] {
  return values.map((t) => t / 1000);
}

export function toNumberArray(values: unknown): number[] | null {
  if (values instanceof Float64Array || values instanceof Float32Array) {
    return values.length > 0 ? Array.from(values) : [];
  }
  if (Array.isArray(values)) {
    if (values.length === 0) return [];
    if (typeof values[0] === "number") return values as number[];
  }
  return null;
}

export function parseNumericSeries(series: FieldSeries | undefined): number[] | null {
  if (!series || series.type !== "numeric") return null;
  return toNumberArray(series.values);
}

export function parseGpsCoordSeries(series: FieldSeries | undefined): number[] | null {
  const raw = parseNumericSeries(series);
  if (!raw) return null;
  return gpsCoordToDegrees(raw);
}

export function parseTimeSeriesMs(series: FieldSeries | undefined): number[] | null {
  const raw = parseNumericSeries(series);
  if (!raw) return null;
  return timeUsToBootMs(raw);
}

export function sampleAtTime(timeMs: number[], values: number[], targetMs: number): number | null {
  if (timeMs.length === 0 || values.length === 0) return null;
  let lo = 0;
  let hi = timeMs.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (timeMs[mid]! < targetMs) lo = mid + 1;
    else hi = mid;
  }
  const idx = lo;
  if (idx >= values.length) return values[values.length - 1] ?? null;
  return values[idx] ?? null;
}
