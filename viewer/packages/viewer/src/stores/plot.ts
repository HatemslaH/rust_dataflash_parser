import { create } from "zustand";

export interface ActivePlot {
  id: string; // e.g. "GPS.Lat" or "GPS[0].Lat"
  messageType: string;
  field: string;
  instance?: number;
  color: string;
  values?: any[];
}

interface PlotState {
  activePlots: ActivePlot[];
  addPlot: (plot: Omit<ActivePlot, "id" | "color" | "values">) => void;
  updatePlotData: (id: string, values: any[]) => void;
  removePlot: (id: string) => void;
  clearPlots: () => void;
}

const COLORS = [
  "#06b6d4", // cyan-500
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
];

export const usePlotStore = create<PlotState>((set, get) => ({
  activePlots: [],
  addPlot: (plot) => {
    const { activePlots } = get();
    const id = plot.instance !== undefined 
      ? `${plot.messageType}[${plot.instance}].${plot.field}`
      : `${plot.messageType}.${plot.field}`;
    
    if (activePlots.some((p) => p.id === id)) {
      return; // Already added
    }

    const color = COLORS[activePlots.length % COLORS.length];
    set({
      activePlots: [...activePlots, { ...plot, id, color }],
    });
  },
  updatePlotData: (id, values) => {
    set({
      activePlots: get().activePlots.map((p) =>
        p.id === id ? { ...p, values } : p
      ),
    });
  },
  removePlot: (id) => {
    set({
      activePlots: get().activePlots.filter((p) => p.id !== id),
    });
  },
  clearPlots: () => {
    set({ activePlots: [] });
  },
}));
