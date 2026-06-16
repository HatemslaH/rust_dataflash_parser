import { createMockParserBackend } from "./mock";
import type { ParserBackend } from "./types";

let backend: ParserBackend = createMockParserBackend("web");

export function getParserBackend(): ParserBackend {
  return backend;
}

export function setParserBackend(next: ParserBackend): void {
  backend = next;
}

export { createMockParserBackend } from "./mock";
export type * from "./types";
