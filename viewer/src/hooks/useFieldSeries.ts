import { useMemo } from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { getParserBackend } from "../platform";
import type { FieldRequest, FieldSeries } from "../platform/types";
import { fieldSeriesQueryKey, formatTypeName } from "../lib/fieldSeriesKey";
import { TIME_FIELD, parseNumericSeries, parseTimeSeriesMs } from "../lib/seriesValues";
import type { ActivePlot } from "../stores/plotStore";

async function fetchFieldSeries(request: FieldRequest): Promise<FieldSeries> {
  const backend = getParserBackend();
  const typeName = formatTypeName(request.messageType, request.instance);
  await backend.loadMessageTypes([typeName]);
  return backend.getFieldSeries(request);
}

const IDLE_FIELD_SERIES_KEY = ["fieldSeries", "_idle"] as const;

export function useFieldSeries(request: FieldRequest | null, enabled = true) {
  const isEnabled = enabled && request !== null;
  return useQuery({
    queryKey: request ? fieldSeriesQueryKey(request) : IDLE_FIELD_SERIES_KEY,
    queryFn: () => fetchFieldSeries(request!),
    enabled: isEnabled,
  });
}

export function usePrefetchFieldSeries() {
  const queryClient = useQueryClient();
  return async (request: FieldRequest) => {
    await queryClient.prefetchQuery({
      queryKey: fieldSeriesQueryKey(request),
      queryFn: () => fetchFieldSeries(request),
    });
  };
}

export interface PlotSeriesData {
  plot: ActivePlot;
  timeMs: number[] | null;
  values: number[] | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
}

export function usePlotSeriesData(activePlots: ActivePlot[]): PlotSeriesData[] {
  const queries = useQueries({
    queries: activePlots.flatMap((plot) => {
      const timeReq: FieldRequest = {
        messageType: plot.messageType,
        field: TIME_FIELD,
        instance: plot.instance,
      };
      const valueReq: FieldRequest = {
        messageType: plot.messageType,
        field: plot.field,
        instance: plot.instance,
      };
      return [
        {
          queryKey: fieldSeriesQueryKey(timeReq),
          queryFn: () => fetchFieldSeries(timeReq),
          enabled: true,
        },
        {
          queryKey: fieldSeriesQueryKey(valueReq),
          queryFn: () => fetchFieldSeries(valueReq),
          enabled: true,
        },
      ];
    }),
  });

  const querySignature = queries
    .map((q) => `${q.dataUpdatedAt}:${q.status}:${q.fetchStatus}`)
    .join("|");

  return useMemo(() => {
    return activePlots.map((plot, i) => {
      const timeResult = queries[i * 2];
      const valueResult = queries[i * 2 + 1];
      const timeMs = parseTimeSeriesMs(timeResult?.data);
      const values = parseNumericSeries(valueResult?.data);
      const errors = [timeResult?.error, valueResult?.error]
        .filter(Boolean)
        .map((e) => (e instanceof Error ? e.message : String(e)));

      return {
        plot,
        timeMs,
        values,
        isLoading: Boolean(timeResult?.isLoading || valueResult?.isLoading),
        isError: Boolean(timeResult?.isError || valueResult?.isError),
        errorMessage: errors.length > 0 ? errors.join("; ") : null,
      };
    });
  }, [activePlots, querySignature, queries]);
}

export function useGpsTrajectory(enabled: boolean) {
  const lat = useFieldSeries(
    enabled ? { messageType: "GPS", field: "Lat" } : null,
    enabled,
  );
  const lng = useFieldSeries(
    enabled ? { messageType: "GPS", field: "Lng" } : null,
    enabled,
  );
  const time = useFieldSeries(
    enabled ? { messageType: "GPS", field: TIME_FIELD } : null,
    enabled,
  );

  const lats = parseNumericSeries(lat.data);
  const lngs = parseNumericSeries(lng.data);
  const timeMs = parseTimeSeriesMs(time.data);

  return {
    lats,
    lngs,
    timeMs,
    isLoading: lat.isLoading || lng.isLoading || time.isLoading,
    isError: lat.isError || lng.isError || time.isError,
  };
}

export function useAttitudeAtTime(timeMs: number | null, enabled: boolean) {
  const roll = useFieldSeries(
    enabled ? { messageType: "ATT", field: "Roll" } : null,
    enabled,
  );
  const pitch = useFieldSeries(
    enabled ? { messageType: "ATT", field: "Pitch" } : null,
    enabled,
  );
  const yaw = useFieldSeries(
    enabled ? { messageType: "ATT", field: "Yaw" } : null,
    enabled,
  );
  const time = useFieldSeries(
    enabled ? { messageType: "ATT", field: TIME_FIELD } : null,
    enabled,
  );

  const rollVals = parseNumericSeries(roll.data);
  const pitchVals = parseNumericSeries(pitch.data);
  const yawVals = parseNumericSeries(yaw.data);
  const times = parseTimeSeriesMs(time.data);

  if (timeMs === null || !times || !rollVals || !pitchVals || !yawVals) {
    return { roll: 0, pitch: 0, yaw: 0, isLoading: roll.isLoading };
  }

  let idx = 0;
  for (let i = 0; i < times.length; i++) {
    if (times[i]! <= timeMs) idx = i;
    else break;
  }

  return {
    roll: rollVals[idx] ?? 0,
    pitch: pitchVals[idx] ?? 0,
    yaw: yawVals[idx] ?? 0,
    isLoading: roll.isLoading || pitch.isLoading,
  };
}
