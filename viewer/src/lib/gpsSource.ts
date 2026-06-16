import type { MessageTypeEntry } from "../platform/types";

const GPS_INSTANCE_RE = /^GPS\[(\d+)\]$/;

export interface GpsSource {
  messageType: string;
  instance?: number;
  loadTypeName: string;
}

/** Pick the first GPS instance when the log uses instanced GPS messages. */
export function resolveGpsSource(types: MessageTypeEntry[]): GpsSource | null {
  const instanced = types
    .map((type) => ({ type, match: GPS_INSTANCE_RE.exec(type.name) }))
    .filter((entry): entry is { type: MessageTypeEntry; match: RegExpExecArray } => entry.match !== null)
    .sort((a, b) => parseInt(a.match[1]!, 10) - parseInt(b.match[1]!, 10));

  if (instanced.length > 0) {
    const first = instanced[0]!;
    return {
      messageType: "GPS",
      instance: parseInt(first.match[1]!, 10),
      loadTypeName: first.type.name,
    };
  }

  if (types.some((type) => type.name === "GPS")) {
    return { messageType: "GPS", loadTypeName: "GPS" };
  }

  return null;
}
