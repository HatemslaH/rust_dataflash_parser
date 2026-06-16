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
  addPlot: (plot: Omit<ActivePlot, "id" | "color" | "yAxis"> & Partial<Pick<ActivePlot, "yAxis">>) => void;
  setPlots: (plots: Array<Omit<ActivePlot, "id" | "color"> & Partial<Pick<ActivePlot, "yAxis">>>) => void;
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
    const yAxis: 1 | 2 = plot.yAxis ?? (activePlots.length % 2 === 0 ? 1 : 2);
    set({ activePlots: [...activePlots, { ...plot, id, color, yAxis }] });
  },

  setPlots: (plots) => {
    set({
      activePlots: plots.map((plot, index) => ({
        ...plot,
        id: makePlotId(plot.messageType, plot.field, plot.instance),
        color: COLORS[index % COLORS.length]!,
        yAxis: plot.yAxis ?? ((index % 2 === 0 ? 1 : 2) as 1 | 2),
      })),
    });
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
