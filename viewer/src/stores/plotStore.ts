import { createStore } from "../lib/createStore";

export interface ActivePlot {
  id: string;
  messageType: string;
  field: string;
  instance?: number;
  color: string;
  yAxis: 1 | 2;
}

interface PlotState {
  activePlots: ActivePlot[];
  addPlot: (plot: Omit<ActivePlot, "id" | "color" | "yAxis">) => void;
  removePlot: (id: string) => void;
  clearPlots: () => void;
  togglePlotAxis: (id: string) => void;
}

const COLORS = [
  "#06b6d4",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

function makePlotId(messageType: string, field: string, instance?: number): string {
  return instance !== undefined
    ? `${messageType}[${instance}].${field}`
    : `${messageType}.${field}`;
}

const plotStore = createStore<PlotState>((set, get) => ({
  activePlots: [],

  addPlot: (plot) => {
    const { activePlots } = get();
    const id = makePlotId(plot.messageType, plot.field, plot.instance);
    if (activePlots.some((p) => p.id === id)) {
      return;
    }
    const color = COLORS[activePlots.length % COLORS.length]!;
    const yAxis: 1 | 2 = activePlots.length % 2 === 0 ? 1 : 2;
    set({ activePlots: [...activePlots, { ...plot, id, color, yAxis }] });
  },

  removePlot: (id) => {
    set({ activePlots: get().activePlots.filter((p) => p.id !== id) });
  },

  clearPlots: () => set({ activePlots: [] }),
  togglePlotAxis: (id) => {
    set({
      activePlots: get().activePlots.map((p) =>
        p.id === id ? { ...p, yAxis: p.yAxis === 1 ? 2 : 1 } : p,
      ),
    });
  },
}));

export const usePlotStore = plotStore.useStore;
export const plotStoreApi = plotStore;
