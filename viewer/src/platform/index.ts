import { createWasmParserBackend } from "./wasm";
import type { ParserBackend } from "./types";

let backend: ParserBackend = createWasmParserBackend("web");

export function getParserBackend(): ParserBackend {
  return backend;
}

export function setParserBackend(next: ParserBackend): void {
  backend = next;
}

export { createMockParserBackend } from "./mock";
export { createWasmParserBackend } from "./wasm";
export type * from "./types";
