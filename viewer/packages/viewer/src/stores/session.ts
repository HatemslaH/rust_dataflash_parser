import { create } from "zustand";
import type { LogSummary, ParseProgress } from "../platform/types";

export interface RecentFile {
  name: string;
  size: number;
  path?: string; // for desktop
  timestamp: number;
}

interface SessionState {
  summary: LogSummary | null;
  progress: ParseProgress;
  theme: "dark" | "light";
  recentFiles: RecentFile[];
  setSummary: (summary: LogSummary | null) => void;
  setProgress: (progress: ParseProgress) => void;
  setTheme: (theme: "dark" | "light") => void;
  addRecentFile: (file: Omit<RecentFile, "timestamp">) => void;
  clearRecentFiles: () => void;
  reset: () => void;
}

const initialProgress: ParseProgress = {
  phase: "ready",
  percent: 0,
  message: "Open a .BIN log to begin",
};

// Load initial theme and recent files from localStorage
const getInitialTheme = (): "dark" | "light" => {
  const saved = localStorage.getItem("dfv_theme");
  if (saved === "light" || saved === "dark") return saved;
  return "dark"; // Default is dark
};

const getInitialRecentFiles = (): RecentFile[] => {
  try {
    const saved = localStorage.getItem("dfv_recent_files");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const useSessionStore = create<SessionState>((set, get) => ({
  summary: null,
  progress: initialProgress,
  theme: getInitialTheme(),
  recentFiles: getInitialRecentFiles(),
  
  setSummary: (summary) => set({ summary }),
  setProgress: (progress) => set({ progress }),
  
  setTheme: (theme) => {
    localStorage.setItem("dfv_theme", theme);
    set({ theme });
  },
  
  addRecentFile: (file) => {
    const { recentFiles } = get();
    // Remove if already exists to move to top
    const filtered = recentFiles.filter(
      (f) => f.name !== file.name || f.path !== file.path
    );
    const updated = [
      { ...file, timestamp: Date.now() },
      ...filtered,
    ].slice(0, 10); // Keep top 10
    
    localStorage.setItem("dfv_recent_files", JSON.stringify(updated));
    set({ recentFiles: updated });
  },
  
  clearRecentFiles: () => {
    localStorage.removeItem("dfv_recent_files");
    set({ recentFiles: [] });
  },
  
  reset: () => set({ summary: null, progress: initialProgress }),
}));
