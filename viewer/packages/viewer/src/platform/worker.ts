import init, { WasmLogSession } from "@dfv/parser-wasm";
// @ts-expect-error - Vite handles ?url suffix for WASM files
import wasmUrl from "@dfv/parser-wasm/pkg/parser_wasm_bg.wasm?url";

let session: WasmLogSession | null = null;
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await init(wasmUrl);
    initialized = true;
  }
}

self.onmessage = async (event: MessageEvent) => {
  const { id, type, payload } = event.data;

  try {
    await ensureInitialized();

    switch (type) {
      case "open_bytes": {
        const { data, fileName } = payload as { data: Uint8Array; fileName: string };
        
        self.postMessage({
          type: "progress",
          payload: { phase: "indexing", percent: 10, message: "Loading bytes..." },
        });

        // Convert Uint8Array to Vec<u8> (WASM)
        session = new WasmLogSession(data);

        self.postMessage({
          type: "progress",
          payload: { phase: "indexing", percent: 50, message: "Indexing log..." },
        });

        session.index();

        self.postMessage({
          type: "progress",
          payload: { phase: "ready", percent: 100, message: "Ready" },
        });

        const summary = session.build_summary(fileName);
        self.postMessage({ id, type: "response", result: summary });
        break;
      }

      case "close_log": {
        session = null;
        self.postMessage({ id, type: "response", result: null });
        break;
      }

      case "list_message_types": {
        if (!session) throw new Error("No log open");
        const types = session.list_message_types();
        self.postMessage({ id, type: "response", result: types });
        break;
      }

      case "load_message_types": {
        if (!session) throw new Error("No log open");
        const { names } = payload as { names: string[] };
        
        const total = names.length;
        for (let i = 0; i < total; i++) {
          const name = names[i]!;
          const percent = (i / total) * 100;
          self.postMessage({
            type: "progress",
            payload: { phase: "loading", percent, message: `Loading ${name}...` },
          });
          session.load_message_types([name]);
        }

        self.postMessage({
          type: "progress",
          payload: { phase: "ready", percent: 100, message: "Ready" },
        });

        self.postMessage({ id, type: "response", result: null });
        break;
      }

      case "get_field_series": {
        if (!session) throw new Error("No log open");
        const { typeName, field, instance } = payload as {
          typeName: string;
          field: string;
          instance?: number;
        };
        const wasmInstance = instance !== undefined && instance !== null ? BigInt(instance) : null;
        const series = session.get_field_series(typeName, field, wasmInstance);
        self.postMessage({ id, type: "response", result: series });
        break;
      }

      case "get_metadata": {
        if (!session) throw new Error("No log open");
        const metadata = session.get_metadata();
        self.postMessage({ id, type: "response", result: metadata });
        break;
      }

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error: any) {
    self.postMessage({ id, type: "error", error: error.message || String(error) });
  }
};
