import { createStore } from "../lib/createStore";
import type { LogSummary, ParseProgress } from "../platform/types";

export interface RecentFile {
  name: string;
  size: number;
  path?: string;
  timestamp: number;
}

interface SessionState {
  summary: LogSummary | null;
  progress: ParseProgress;
  theme: "dark" | "light";
  recentFiles: RecentFile[];
  processDone: boolean;
  showPlot: boolean;
  showMap: boolean;
  showAttitude: boolean;
  setSummary: (summary: LogSummary | null) => void;
  setProgress: (progress: ParseProgress) => void;
  setTheme: (theme: "dark" | "light") => void;
  addRecentFile: (file: Omit<RecentFile, "timestamp">) => void;
  clearRecentFiles: () => void;
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

function getInitialTheme(): "dark" | "light" {
  const saved = localStorage.getItem("dfv_theme");
  if (saved === "light" || saved === "dark") return saved;
  return "dark";
}

function getInitialRecentFiles(): RecentFile[] {
  try {
    const saved = localStorage.getItem("dfv_recent_files");
    return saved ? (JSON.parse(saved) as RecentFile[]) : [];
  } catch {
    return [];
  }
}

const sessionStore = createStore<SessionState>((set, get) => ({
  summary: null,
  progress: initialProgress,
  theme: getInitialTheme(),
  recentFiles: getInitialRecentFiles(),
  processDone: false,
  showPlot: true,
  showMap: true,
  showAttitude: false,

  setSummary: (summary) => set({ summary, processDone: summary !== null }),
  setProgress: (progress) => set({ progress }),
  setTheme: (theme) => {
    localStorage.setItem("dfv_theme", theme);
    set({ theme });
  },
  addRecentFile: (file) => {
    const filtered = get().recentFiles.filter(
      (f) => f.name !== file.name || f.path !== file.path,
    );
    const updated = [{ ...file, timestamp: Date.now() }, ...filtered].slice(0, 10);
    localStorage.setItem("dfv_recent_files", JSON.stringify(updated));
    set({ recentFiles: updated });
  },
  clearRecentFiles: () => {
    localStorage.removeItem("dfv_recent_files");
    set({ recentFiles: [] });
  },
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
