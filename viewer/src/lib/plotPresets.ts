import type { MessageTypeEntry } from "../platform/types";
import { parseTypeName } from "./fieldSeriesKey";
import { PLOT_PRESET_GRAPHS } from "./plotPresetsData";

export interface PresetPlotField {
  messageType: string;
  field: string;
  instance?: number;
  yAxis: 1 | 2;
}

export interface PlotPresetGraph {
  path: string;
  alternatives: string[];
}

export { PLOT_PRESET_GRAPHS } from "./plotPresetsData";

const SIMPLE_TOKEN_RE = /^([A-Z][A-Z0-9_]*(?:\[\d+])?)\.([A-Za-z0-9_]+)(?::2)?$/;

function parsePresetExpression(expression: string): PresetPlotField[] | null {
  const tokens = expression.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  const fields: PresetPlotField[] = [];
  for (const token of tokens) {
    const match = SIMPLE_TOKEN_RE.exec(token);
    if (!match) return null;

    const typeName = match[1]!;
    const field = match[2]!;
    const { baseName, instance } = parseTypeName(typeName);
    fields.push({
      messageType: baseName,
      field,
      instance,
      yAxis: token.endsWith(":2") ? 2 : 1,
    });
  }
  return fields;
}

function isFieldAvailable(
  types: MessageTypeEntry[],
  messageType: string,
  field: string,
  instance?: number,
): boolean {
  const typeName = instance !== undefined ? `${messageType}[${instance}]` : messageType;
  const entry = types.find((type) => type.name === typeName);
  return entry?.fields.some((f) => f.name === field) ?? false;
}

function isAlternativeAvailable(
  types: MessageTypeEntry[],
  fields: PresetPlotField[],
): boolean {
  return fields.every((field) =>
    isFieldAvailable(types, field.messageType, field.field, field.instance),
  );
}

export interface AvailablePreset {
  path: string;
  label: string;
  fields: PresetPlotField[];
}

export function resolveAvailablePresets(types: MessageTypeEntry[]): AvailablePreset[] {
  const presets: AvailablePreset[] = [];

  for (const graph of PLOT_PRESET_GRAPHS) {
    let resolved: PresetPlotField[] | null = null;
    for (const alternative of graph.alternatives) {
      const fields = parsePresetExpression(alternative);
      if (fields && isAlternativeAvailable(types, fields)) {
        resolved = fields;
        break;
      }
    }
    if (!resolved) continue;

    const segments = graph.path.split("/");
    presets.push({
      path: graph.path,
      label: segments[segments.length - 1]!,
      fields: resolved,
    });
  }

  return presets;
}

export type PresetTreeNode =
  | { kind: "group"; name: string; children: PresetTreeNode[] }
  | { kind: "preset"; name: string; preset: AvailablePreset };

function findOrCreateGroup(
  level: PresetTreeNode[],
  name: string,
): Extract<PresetTreeNode, { kind: "group" }> {
  const existing = level.find(
    (node): node is Extract<PresetTreeNode, { kind: "group" }> =>
      node.kind === "group" && node.name === name,
  );
  if (existing) return existing;
  const group: Extract<PresetTreeNode, { kind: "group" }> = {
    kind: "group",
    name,
    children: [],
  };
  level.push(group);
  return group;
}

export function buildPresetTree(presets: AvailablePreset[]): PresetTreeNode[] {
  const root: PresetTreeNode[] = [];

  for (const preset of presets) {
    const segments = preset.path.split("/");
    let level = root;

    for (let i = 0; i < segments.length - 1; i++) {
      const group = findOrCreateGroup(level, segments[i]!);
      level = group.children;
    }

    level.push({
      kind: "preset",
      name: segments[segments.length - 1]!,
      preset,
    });
  }

  return root;
}
