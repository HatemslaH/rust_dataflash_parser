import type { ParserBackend } from "./types";

let backend: ParserBackend | null = null;

export function setParserBackend(instance: ParserBackend): void {
  backend = instance;
}

export function getParserBackend(): ParserBackend {
  if (!backend) {
    throw new Error("ParserBackend is not initialized. Call setParserBackend() first.");
  }
  return backend;
}

export function tryGetParserBackend(): ParserBackend | null {
  return backend;
}

export * from "./types";
