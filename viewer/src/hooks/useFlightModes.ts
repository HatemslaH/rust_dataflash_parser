import { useMemo } from "react";
import { extractFlightModeChanges, type FlightModeSegment } from "../lib/flightModes";
import { TIME_FIELD, parseTextSeries, parseTimeSeriesMs } from "../lib/seriesValues";
import { useSessionStore } from "../stores/sessionStore";
import { useFieldSeries } from "./useFieldSeries";

function stableTextKey(series: ReturnType<typeof parseTextSeries>): string {
  if (!series || series.length === 0) return "";
  const head = series.slice(0, 4).join("\0");
  const tail = series.length > 4 ? series.slice(-2).join("\0") : "";
  return `${series.length}:${head}:${tail}`;
}

export function useFlightModes(logEndMs: number, enabled: boolean): FlightModeSegment[] {
  const summary = useSessionStore((s) => s.summary);
  const active = enabled && summary !== null;

  // MSG must be loaded before MODE so vehicle type (ArduPlane vs Copter) is known.
  const msg = useFieldSeries(
    active ? { messageType: "MSG", field: "Message" } : null,
    active,
  );
  const modesReady = active && msg.isFetched;

  const modeTime = useFieldSeries(
    modesReady ? { messageType: "MODE", field: TIME_FIELD } : null,
    modesReady,
  );
  const modeAsText = useFieldSeries(
    modesReady ? { messageType: "MODE", field: "asText" } : null,
    modesReady,
  );

  const timeMs = parseTimeSeriesMs(modeTime.data);
  const modes = parseTextSeries(modeAsText.data);
  const modesKey = stableTextKey(modes);

  return useMemo(() => {
    if (!timeMs || !modes) return [];
    return extractFlightModeChanges(timeMs, modes, logEndMs, 0);
    // modesKey captures text content without unstable array reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeMs, modesKey, logEndMs]);
}
