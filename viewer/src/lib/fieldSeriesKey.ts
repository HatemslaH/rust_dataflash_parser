import type { FieldRequest } from "../platform/types";
import type { ActivePlot } from "../stores/plotStore";

export function parseTypeName(typeName: string): { baseName: string; instance?: number } {
  const match = typeName.match(/^([^[]+)\[(\d+)\]$/);
  if (match) {
    return { baseName: match[1]!, instance: parseInt(match[2]!, 10) };
  }
  return { baseName: typeName };
}

export function formatTypeName(messageType: string, instance?: number): string {
  return instance !== undefined ? `${messageType}[${instance}]` : messageType;
}

export function plotId(messageType: string, field: string, instance?: number): string {
  return instance !== undefined
    ? `${messageType}[${instance}].${field}`
    : `${messageType}.${field}`;
}

export function fieldSeriesQueryKey(
  request: FieldRequest,
): readonly [string, string, string, number | null] {
  return ["fieldSeries", request.messageType, request.field, request.instance ?? null] as const;
}

export function plotToFieldRequest(plot: ActivePlot, field?: string): FieldRequest {
  return {
    messageType: plot.messageType,
    field: field ?? plot.field,
    instance: plot.instance,
  };
}
