declare module "../../parser-wasm/pkg/parser_wasm.js" {
  export default function init(module_or_path?: unknown): Promise<void>;

  export class WasmLogSession {
  constructor();
  static fromBytes(data: Uint8Array, fileName: string): WasmLogSession;
  close(): void;
  summary(): unknown;
  listMessageTypes(): unknown;
  loadMessageTypes(names: string[]): void;
  getFieldSeries(messageType: string, field: string, instance?: number): unknown;
  metadata(): unknown;
  }
}
