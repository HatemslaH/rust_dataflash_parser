import { create } from "zustand";
import type { LogSummary, ParseProgress } from "../platform/types";

interface SessionState {
  summary: LogSummary | null;
  progress: ParseProgress;
  setSummary: (summary: LogSummary | null) => void;
  setProgress: (progress: ParseProgress) => void;
  reset: () => void;
}

const initialProgress: ParseProgress = {
  phase: "ready",
  percent: 0,
  message: "Open a .BIN log to begin",
};

export const useSessionStore = create<SessionState>((set) => ({
  summary: null,
  progress: initialProgress,
  setSummary: (summary) => set({ summary }),
  setProgress: (progress) => set({ progress }),
  reset: () => set({ summary: null, progress: initialProgress }),
}));
