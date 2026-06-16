import { createStore } from "../lib/createStore";

interface TimeState {
  hoveredTimeMs: number | null;
  timeRange: [number, number] | null;
  logDurationMs: number;
  setHoveredTimeMs: (timeMs: number | null) => void;
  setTimeRange: (range: [number, number] | null) => void;
  setLogDurationMs: (durationMs: number) => void;
  reset: () => void;
}

const initialState = {
  hoveredTimeMs: null as number | null,
  timeRange: null as [number, number] | null,
  logDurationMs: 0,
};

const timeStore = createStore<TimeState>((set, get) => ({
  ...initialState,
  setHoveredTimeMs: (hoveredTimeMs) => {
    if (get().hoveredTimeMs === hoveredTimeMs) return;
    set({ hoveredTimeMs });
  },
  setTimeRange: (timeRange) => {
    const current = get().timeRange;
    if (
      current === timeRange ||
      (current &&
        timeRange &&
        current[0] === timeRange[0] &&
        current[1] === timeRange[1])
    ) {
      return;
    }
    set({ timeRange });
  },
  setLogDurationMs: (logDurationMs) => {
    if (get().logDurationMs === logDurationMs) return;
    set({ logDurationMs });
  },
  reset: () => set(initialState),
}));

export const useTimeStore = timeStore.useStore;
export const timeStoreApi = timeStore;
