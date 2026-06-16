import { createStore } from "../lib/createStore";
import type { LogSummary, ParseProgress } from "../platform/types";

interface SessionState {
  summary: LogSummary | null;
  progress: ParseProgress;
  processDone: boolean;
  showPlot: boolean;
  showMap: boolean;
  showAttitude: boolean;
  setSummary: (summary: LogSummary | null) => void;
  setProgress: (progress: ParseProgress) => void;
  setProcessDone: (done: boolean) => void;
  setShowPlot: (show: boolean) => void;
  setShowMap: (show: boolean) => void;
  setShowAttitude: (show: boolean) => void;
  reset: () => void;
}

const initialProgress: ParseProgress = {
  phase: "ready",
  percent: 0,
  message: "Open a .BIN log to begin",
};

const sessionStore = createStore<SessionState>((set) => ({
  summary: null,
  progress: initialProgress,
  processDone: false,
  showPlot: true,
  showMap: true,
  showAttitude: false,

  setSummary: (summary) => set({ summary, processDone: summary !== null }),
  setProgress: (progress) => set({ progress }),
  setProcessDone: (processDone) => set({ processDone }),
  setShowPlot: (showPlot) => set({ showPlot }),
  setShowMap: (showMap) => set({ showMap }),
  setShowAttitude: (showAttitude) => set({ showAttitude }),
  reset: () =>
    set({
      summary: null,
      progress: initialProgress,
      processDone: false,
    }),
}));

export const useSessionStore = sessionStore.useStore;
export const sessionStoreApi = sessionStore;
