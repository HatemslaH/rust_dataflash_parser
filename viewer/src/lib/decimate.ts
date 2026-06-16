import { toNumberArray } from "./seriesValues";

export const MAX_DISPLAY_POINTS = 10_000;

export function decimateMinMax(
  x: number[],
  y: number[],
  maxPoints: number = MAX_DISPLAY_POINTS,
): { x: number[]; y: number[] } {
  const n = x.length;
  if (n <= maxPoints) {
    return { x, y };
  }

  const buckets = Math.floor(maxPoints / 2);
  const bucketSize = n / buckets;
  const outX: number[] = [];
  const outY: number[] = [];

  for (let b = 0; b < buckets; b++) {
    const start = Math.floor(b * bucketSize);
    const end = Math.min(Math.floor((b + 1) * bucketSize), n);
    if (start >= end) continue;

    let minI = start;
    let maxI = start;
    for (let i = start + 1; i < end; i++) {
      if (y[i]! < y[minI]!) minI = i;
      if (y[i]! > y[maxI]!) maxI = i;
    }

    if (minI <= maxI) {
      outX.push(x[minI]!);
      outY.push(y[minI]!);
      if (minI !== maxI) {
        outX.push(x[maxI]!);
        outY.push(y[maxI]!);
      }
    } else {
      outX.push(x[maxI]!);
      outY.push(y[maxI]!);
      outX.push(x[minI]!);
      outY.push(y[minI]!);
    }
  }

  const last = n - 1;
  if (outX.length === 0 || outX[outX.length - 1] !== x[last]) {
    outX.push(x[last]!);
    outY.push(y[last]!);
  }

  return { x: outX, y: outY };
}

export function asNumericArray(values: unknown): number[] | null {
  return toNumberArray(values);
}
