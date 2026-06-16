import type { ParserBackend } from "../platform/types";
import type { FieldRequest } from "../platform/types";
import { fieldRequestCacheKey, formatTypeName } from "./fieldSeriesKey";
import { TIME_FIELD } from "./seriesValues";

export interface PlotFieldRef {
  messageType: string;
  field: string;
  instance?: number;
}

export function collectFieldRequests(fields: PlotFieldRef[]): FieldRequest[] {
  const unique = new Map<string, FieldRequest>();

  for (const field of fields) {
    const base = { messageType: field.messageType, instance: field.instance };
    const timeReq = { ...base, field: TIME_FIELD };
    const valueReq = { ...base, field: field.field };

    unique.set(fieldRequestCacheKey(timeReq), timeReq);
    unique.set(fieldRequestCacheKey(valueReq), valueReq);
  }

  return [...unique.values()];
}

export async function loadPlotFields(
  backend: ParserBackend,
  prefetch: (request: FieldRequest) => Promise<void>,
  fields: PlotFieldRef[],
): Promise<void> {
  const typeNames = [
    ...new Set(fields.map((field) => formatTypeName(field.messageType, field.instance))),
  ];
  await backend.loadMessageTypes(typeNames);
  await Promise.all(collectFieldRequests(fields).map((request) => prefetch(request)));
}
