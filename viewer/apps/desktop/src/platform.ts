import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type {
  FieldRequest,
  FieldSeries,
  LogMetadata,
  LogSummary,
  MessageTypeEntry,
  ParseProgress,
  ParserBackend,
  Unsubscribe,
} from "@dfv/viewer";

export function createDesktopParserBackend(): ParserBackend {
  const progressListeners = new Set<(progress: ParseProgress) => void>();

  // Set up the Tauri event listener once
  void listen<ParseProgress>("parse_progress", (event) => {
    for (const listener of progressListeners) {
      listener(event.payload);
    }
  });

  return {
    platform: "desktop",

    async openFile(source: File | string): Promise<LogSummary> {
      if (typeof source === "string") {
        return invoke<LogSummary>("open_log", { path: source });
      }
      // On desktop, the File object from drag-and-drop or file input has a 'path' property
      if ("path" in source && typeof (source as any).path === "string" && (source as any).path) {
        return invoke<LogSummary>("open_log", { path: (source as any).path });
      }
      const buffer = await source.arrayBuffer();
      return invoke<LogSummary>("open_bytes", { data: Array.from(new Uint8Array(buffer)) });
    },

    closeLog(): Promise<void> {
      return invoke("close_log");
    },

    listMessageTypes(): Promise<MessageTypeEntry[]> {
      return invoke<MessageTypeEntry[]>("list_message_types");
    },

    loadMessageTypes(names: string[]): Promise<void> {
      return invoke("load_message_types", { names });
    },

    getFieldSeries(request: FieldRequest): Promise<FieldSeries> {
      return invoke<FieldSeries>("get_field_series", {
        typeName: request.messageType,
        field: request.field,
        instance: request.instance ?? null,
      });
    },

    getMetadata(): Promise<LogMetadata> {
      return invoke<LogMetadata>("get_metadata");
    },

    onProgress(callback: (progress: ParseProgress) => void): Unsubscribe {
      progressListeners.add(callback);
      return () => {
        progressListeners.delete(callback);
      };
    },
  };
}
