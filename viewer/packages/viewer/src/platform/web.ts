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

export function createWebParserBackend(): ParserBackend {
  const progressListeners = new Set<(progress: ParseProgress) => void>();
  const pendingRequests = new Map<
    string,
    { resolve: (value: any) => void; reject: (reason: any) => void }
  >();

  // Spawn the web worker using Vite's worker import syntax
  const worker = new Worker(
    new URL("./worker.ts", import.meta.url),
    { type: "module" }
  );

  worker.onmessage = (event: MessageEvent) => {
    const { id, type, result, error, payload } = event.data;

    if (type === "progress") {
      const progress = payload as ParseProgress;
      for (const listener of progressListeners) {
        listener(progress);
      }
    } else if (type === "response") {
      const req = pendingRequests.get(id);
      if (req) {
        pendingRequests.delete(id);
        req.resolve(result);
      }
    } else if (type === "error") {
      const req = pendingRequests.get(id);
      if (req) {
        pendingRequests.delete(id);
        req.reject(new Error(error));
      }
    }
  };

  function sendRequest<T>(type: string, payload?: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const id = Math.random().toString(36).substring(2, 11);
      pendingRequests.set(id, { resolve, reject });
      worker.postMessage({ id, type, payload });
    });
  }

  return {
    platform: "web",

    async openFile(source: File | string): Promise<LogSummary> {
      if (typeof source === "string") {
        throw new Error("Opening file by path is not supported on web platform");
      }

      const buffer = await source.arrayBuffer();
      const data = new Uint8Array(buffer);

      return sendRequest<LogSummary>("open_bytes", {
        data,
        fileName: source.name,
      });
    },

    closeLog(): Promise<void> {
      return sendRequest<void>("close_log");
    },

    listMessageTypes(): Promise<MessageTypeEntry[]> {
      return sendRequest<MessageTypeEntry[]>("list_message_types");
    },

    loadMessageTypes(names: string[]): Promise<void> {
      return sendRequest<void>("load_message_types", { names });
    },

    getFieldSeries(request: FieldRequest): Promise<FieldSeries> {
      return sendRequest<FieldSeries>("get_field_series", {
        typeName: request.messageType,
        field: request.field,
        instance: request.instance,
      });
    },

    getMetadata(): Promise<LogMetadata> {
      return sendRequest<LogMetadata>("get_metadata");
    },

    onProgress(callback: (progress: ParseProgress) => void): Unsubscribe {
      progressListeners.add(callback);
      return () => progressListeners.delete(callback);
    },
  };
}
export default createWebParserBackend;
