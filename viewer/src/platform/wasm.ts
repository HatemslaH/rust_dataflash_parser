import init, { WasmLogSession } from "../../parser-wasm/pkg/parser_wasm.js";
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

const LARGE_FILE_BYTES = 200 * 1024 * 1024;

let wasmReady: Promise<void> | null = null;
let session: WasmLogSession | null = null;

async function ensureWasm(): Promise<void> {
  if (!wasmReady) {
    wasmReady = init().then(() => undefined);
  }
  await wasmReady;
}

export function createWasmParserBackend(platform: "web" | "desktop"): ParserBackend {
  const progressListeners = new Set<(progress: ParseProgress) => void>();

  const emit = (progress: ParseProgress) => {
    for (const listener of progressListeners) {
      listener(progress);
    }
  };

  void ensureWasm();

  return {
    platform,

    async openFile(source: File | string): Promise<LogSummary> {
      await ensureWasm();

      let fileName: string;
      let bytes: Uint8Array;

      if (typeof source === "string") {
        fileName = source.split(/[/\\]/).pop() || source;
        emit({ phase: "indexing", percent: 5, message: "Fetching sample log…" });
        const baseUrl = import.meta.env.BASE_URL;
        const response = await fetch(`${baseUrl}${fileName}`);
        if (!response.ok) {
          throw new Error(`Failed to load ${fileName}: ${response.status}`);
        }
        bytes = new Uint8Array(await response.arrayBuffer());
      } else {
        fileName = source.name;
        if (source.size > LARGE_FILE_BYTES) {
          emit({
            phase: "indexing",
            percent: 0,
            message: `Warning: ${(source.size / (1024 * 1024)).toFixed(0)} MB log — parsing may be slow in the browser`,
          });
        }
        emit({ phase: "indexing", percent: 10, message: "Reading file…" });
        bytes = new Uint8Array(await source.arrayBuffer());
      }

      emit({ phase: "indexing", percent: 40, message: "Indexing log…" });
      session?.close();
      session = WasmLogSession.fromBytes(bytes, fileName);
      const summary = session.summary() as LogSummary;
      emit({ phase: "ready", percent: 100, message: "Ready" });
      return summary;
    },

    async closeLog(): Promise<void> {
      session?.close();
      session = null;
      emit({ phase: "ready", percent: 0, message: "Open a .BIN log to begin" });
    },

    async listMessageTypes(): Promise<MessageTypeEntry[]> {
      if (!session) return [];
      return session.listMessageTypes() as MessageTypeEntry[];
    },

    async loadMessageTypes(names: string[]): Promise<void> {
      if (!session) throw new Error("No log open");
      emit({
        phase: "loading",
        percent: 50,
        message: `Loading ${names.join(", ")}…`,
      });
      session.loadMessageTypes(names);
      emit({ phase: "ready", percent: 100, message: "Ready" });
    },

    async getFieldSeries(request: FieldRequest): Promise<FieldSeries> {
      if (!session) throw new Error("No log open");
      return session.getFieldSeries(
        request.messageType,
        request.field,
        request.instance,
      ) as FieldSeries;
    },

    async getMetadata(): Promise<LogMetadata> {
      if (!session) throw new Error("No log open");
      return session.metadata() as LogMetadata;
    },

    onProgress(callback: (progress: ParseProgress) => void): Unsubscribe {
      progressListeners.add(callback);
      return () => progressListeners.delete(callback);
    },
  };
}
