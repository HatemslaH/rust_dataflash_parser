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

const SERIES_LENGTH = 600;
const DEMO_ORIGIN = { lat: -35.36325, lng: 149.16523 };

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
      { name: "Status", units: "" },
    ],
  },
  {
    name: "BARO",
    count: 6_200,
    loaded: false,
    fields: [
      { name: "Alt", units: "m" },
      { name: "Press", units: "Pa" },
    ],
  },
  {
    name: "MODE",
    count: 42,
    loaded: false,
    fields: [
      { name: "Mode", units: "" },
      { name: "ModeNum", units: "" },
    ],
  },
  {
    name: "RCIN",
    count: 6_200,
    loaded: false,
    fields: [
      { name: "C1", units: "pwm" },
      { name: "C2", units: "pwm" },
      { name: "C3", units: "pwm" },
      { name: "C4", units: "pwm" },
    ],
  },
];

function numericSeries(length: number, fn: (i: number) => number): FieldSeries {
  const values = Array.from({ length }, (_, i) => fn(i));
  return { type: "numeric", values };
}

function timeUsAt(i: number): number {
  return i * 100_000;
}

function gpsLat(i: number): number {
  const t = i / SERIES_LENGTH;
  return DEMO_ORIGIN.lat + Math.sin(t * Math.PI * 2) * 0.002 + t * 0.0015;
}

function gpsLng(i: number): number {
  const t = i / SERIES_LENGTH;
  return DEMO_ORIGIN.lng + Math.cos(t * Math.PI * 1.5) * 0.0025 + t * 0.002;
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
      const fileName = typeof source === "string" ? source.split(/[/\\]/).pop() || source : source.name;
      const fileSize = typeof source === "string" ? 2_450_000 : source.size;

      emit({ phase: "indexing", percent: 10, message: "Indexing log…" });
      await delay(180);
      emit({ phase: "indexing", percent: 55, message: "Reading FMT headers…" });
      await delay(180);
      emit({ phase: "indexing", percent: 85, message: "Building type index…" });
      await delay(120);

      for (const entry of MOCK_TYPES) {
        entry.loaded = false;
      }

      emit({ phase: "ready", percent: 100, message: "Ready" });

      summary = {
        fileName,
        fileSize,
        messageTypeCount: MOCK_TYPES.length,
        availableTypes: MOCK_TYPES.map((t) => t.name),
        fmtStats: Object.fromEntries(
          MOCK_TYPES.map((t) => [t.name, { count: t.count, msg_size: 32, size: t.count * 32 }]),
        ),
        startTime: new Date("2024-06-15T09:42:00Z").toISOString(),
      };
      return summary;
    },

    async closeLog(): Promise<void> {
      summary = null;
      for (const entry of MOCK_TYPES) {
        entry.loaded = false;
      }
      emit({ phase: "ready", percent: 0, message: "Open a .BIN log to begin" });
    },

    async listMessageTypes(): Promise<MessageTypeEntry[]> {
      if (!summary) {
        return [];
      }
      return MOCK_TYPES.map((t) => ({ ...t, fields: [...t.fields] }));
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
      await delay(120);
      for (const entry of MOCK_TYPES) {
        if (names.includes(entry.name)) {
          entry.loaded = true;
        }
      }
      emit({ phase: "ready", percent: 100, message: "Ready" });
    },

    async getFieldSeries(request: FieldRequest): Promise<FieldSeries> {
      const length = SERIES_LENGTH;

      if (request.field === "TimeUS") {
        return numericSeries(length, (i) => timeUsAt(i));
      }

      switch (request.field) {
        case "Roll":
          return numericSeries(length, (i) => Math.sin(i / 18) * 18);
        case "Pitch":
          return numericSeries(length, (i) => Math.cos(i / 22) * 10);
        case "Yaw":
          return numericSeries(length, (i) => ((i * 2.4) % 360) - 180);
        case "Alt":
          if (request.messageType === "BARO") {
            return numericSeries(length, (i) => 118 + Math.sin(i / 25) * 4);
          }
          return numericSeries(length, (i) => 120 + Math.sin(i / 20) * 12 + i * 0.02);
        case "Press":
          return numericSeries(length, (i) => 101_325 - i * 0.4);
        case "Spd":
          return numericSeries(length, (i) => 4 + Math.abs(Math.sin(i / 15)) * 6);
        case "Lat":
          return numericSeries(length, gpsLat);
        case "Lng":
          return numericSeries(length, gpsLng);
        case "C1":
          return numericSeries(length, (i) => 1500 + Math.sin(i / 8) * 200);
        case "C2":
          return numericSeries(length, (i) => 1500 + Math.cos(i / 9) * 180);
        case "C3":
          return numericSeries(length, (i) => 1100 + Math.abs(Math.sin(i / 12)) * 400);
        case "C4":
          return numericSeries(length, (i) => 1500 + Math.sin(i / 6) * 120);
        case "ModeNum":
          return numericSeries(length, (i) => (i % 240 < 120 ? 4 : 10));
        case "Mode":
        case "asText":
          return {
            type: "text",
            values: Array.from({ length }, (_, i) => (i % 240 < 120 ? "LOITER" : "AUTO")),
          };
        case "Status":
          return numericSeries(length, () => 3);
        default:
          return numericSeries(length, (i) => i * 0.1);
      }
    },

    async getMetadata(): Promise<LogMetadata> {
      if (!summary) {
        throw new Error("No log open");
      }
      return {
        fileSize: summary.fileSize,
        messageTypeCount: summary.messageTypeCount,
        startTime: summary.startTime,
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
