import type {
  FieldRequest,
  FieldSeries,
  LogMetadata,
  LogSummary,
  MessageTypeEntry,
  ParseProgress,
  ParserBackend,
  Unsubscribe,
} from "./types";

const MOCK_TYPES: MessageTypeEntry[] = [
  {
    name: "ATT",
    count: 12_400,
    loaded: false,
    fields: [
      { name: "Roll", units: "deg" },
      { name: "Pitch", units: "deg" },
      { name: "Yaw", units: "deg" },
    ],
  },
  {
    name: "GPS",
    count: 3_100,
    loaded: false,
    fields: [
      { name: "Lat", units: "deg" },
      { name: "Lng", units: "deg" },
      { name: "Alt", units: "m" },
      { name: "Spd", units: "m/s" },
    ],
  },
  {
    name: "MODE",
    count: 42,
    loaded: false,
    fields: [
      { name: "Mode", units: "" },
      { name: "asText", units: "" },
    ],
  },
];

function numericSeries(length: number, fn: (i: number) => number): FieldSeries {
  const values = Array.from({ length }, (_, i) => fn(i));
  return { type: "numeric", values };
}

export function createMockParserBackend(platform: "web" | "desktop"): ParserBackend {
  let summary: LogSummary | null = null;
  const progressListeners = new Set<(progress: ParseProgress) => void>();

  const emit = (progress: ParseProgress) => {
    for (const listener of progressListeners) {
      listener(progress);
    }
  };

  return {
    platform,

    async openFile(source: File | string): Promise<LogSummary> {
      const fileName = typeof source === "string" ? source : source.name;
      const fileSize = typeof source === "string" ? 0 : source.size;

      emit({ phase: "indexing", percent: 10, message: "Indexing log…" });
      await delay(200);
      emit({ phase: "indexing", percent: 60, message: "Reading FMT headers…" });
      await delay(200);
      emit({ phase: "ready", percent: 100, message: "Ready" });

      summary = {
        fileName: fileName,
        fileSize: fileSize,
        messageTypeCount: MOCK_TYPES.length,
        availableTypes: MOCK_TYPES.map((t) => t.name),
        fmtStats: Object.fromEntries(
          MOCK_TYPES.map((t) => [t.name, { count: t.count, msg_size: 32, size: t.count * 32 }]),
        ),
      };
      return summary;
    },

    async closeLog(): Promise<void> {
      summary = null;
      emit({ phase: "ready", percent: 0, message: "No log open" });
    },

    async listMessageTypes(): Promise<MessageTypeEntry[]> {
      if (!summary) {
        return [];
      }
      return MOCK_TYPES.map((t) => ({ ...t }));
    },

    async loadMessageTypes(names: string[]): Promise<void> {
      if (!summary) {
        throw new Error("No log open");
      }
      emit({
        phase: "loading",
        percent: 50,
        message: `Loading ${names.join(", ")}…`,
      });
      await delay(150);
      for (const entry of MOCK_TYPES) {
        if (names.includes(entry.name)) {
          entry.loaded = true;
        }
      }
      emit({ phase: "ready", percent: 100, message: "Ready" });
    },

    async getFieldSeries(request: FieldRequest): Promise<FieldSeries> {
      const length = 200;
      const t = Array.from({ length }, (_, i) => i * 100);

      if (request.field === "time_boot_ms" || request.field === "TimeUS") {
        return numericSeries(length, (i) => t[i]!);
      }

      switch (request.field) {
        case "Roll":
        case "Pitch":
          return numericSeries(length, (i) => Math.sin(i / 12) * (request.field === "Roll" ? 15 : 8));
        case "Yaw":
          return numericSeries(length, (i) => (i * 3) % 360);
        case "Alt":
          return numericSeries(length, (i) => 120 + Math.sin(i / 20) * 8);
        case "Spd":
          return numericSeries(length, (i) => 5 + Math.abs(Math.sin(i / 15)) * 3);
        case "Lat":
          return numericSeries(length, (i) => -35.36325 + i * 0.00001);
        case "Lng":
          return numericSeries(length, (i) => 149.16523 + i * 0.00001);
        default:
          return numericSeries(length, (i) => i);
      }
    },

    async getMetadata(): Promise<LogMetadata> {
      if (!summary) {
        throw new Error("No log open");
      }
      return {
        fileSize: summary.fileSize,
        messageTypeCount: summary.messageTypeCount,
      };
    },

    onProgress(callback: (progress: ParseProgress) => void): Unsubscribe {
      progressListeners.add(callback);
      return () => progressListeners.delete(callback);
    },
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
