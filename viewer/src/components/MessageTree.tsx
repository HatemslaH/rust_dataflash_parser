import { useEffect, useMemo, useState } from "react";
import {
  IconSearch,
  IconX,
  IconChevronDown,
  IconChevronRight,
  IconChartLine,
} from "@tabler/icons-react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { getParserBackend } from "../platform";
import type { MessageTypeEntry } from "../platform/types";
import { useSessionStore } from "../stores/sessionStore";
import { usePlotStore } from "../stores/plotStore";
import { usePrefetchFieldSeries } from "../hooks/useFieldSeries";
import { parseTypeName, plotId } from "../lib/fieldSeriesKey";
import { loadPlotFields } from "../lib/plotFieldLoader";
import {
  buildPresetTree,
  resolveAvailablePresets,
  type AvailablePreset,
} from "../lib/plotPresets";
import { PresetTree } from "./PresetTree";

const SYSTEM_TYPES = ["FMT", "FMTU", "MULT", "UNIT"];

function compareTypes(a: MessageTypeEntry, b: MessageTypeEntry): number {
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
}

export function MessageTree() {
  const summary = useSessionStore((s) => s.summary);
  const [types, setTypes] = useState<MessageTypeEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [hideSystem, setHideSystem] = useState(true);
  const [loadingField, setLoadingField] = useState<string | null>(null);
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);
  const backend = getParserBackend();
  const prefetchFieldSeries = usePrefetchFieldSeries();

  const activePlots = usePlotStore((s) => s.activePlots);
  const addPlot = usePlotStore((s) => s.addPlot);
  const setPlots = usePlotStore((s) => s.setPlots);
  const removePlot = usePlotStore((s) => s.removePlot);
  const clearPlots = usePlotStore((s) => s.clearPlots);
  const togglePlotAxis = usePlotStore((s) => s.togglePlotAxis);

  useEffect(() => {
    if (!summary) return;
    void backend.listMessageTypes().then((entries) => {
      setTypes([...entries].sort(compareTypes));
    });
  }, [summary, backend]);

  const presetTree = useMemo(() => {
    const available = resolveAvailablePresets(types);
    return buildPresetTree(available);
  }, [types]);

  if (!summary) {
    return (
      <Text size="sm" c="dimmed">
        Open a log to browse message types.
      </Text>
    );
  }

  const needle = filter.trim().toLowerCase();
  const filtered = types
    .filter((type) => {
      if (hideSystem && SYSTEM_TYPES.includes(type.name)) return false;
      if (!needle) return true;
      if (type.name.toLowerCase().includes(needle)) return true;
      return type.fields.some((f) => f.name.toLowerCase().includes(needle));
    })
    .sort(compareTypes);

  const refreshTypes = async () => {
    const updatedTypes = await backend.listMessageTypes();
    setTypes([...updatedTypes].sort(compareTypes));
  };

  const onFieldClick = async (typeName: string, fieldName: string) => {
    const { baseName, instance } = parseTypeName(typeName);
    const fieldKey = plotId(baseName, fieldName, instance);

    addPlot({ messageType: baseName, field: fieldName, instance });

    setLoadingField(fieldKey);
    try {
      await loadPlotFields(backend, prefetchFieldSeries, [
        { messageType: baseName, field: fieldName, instance },
      ]);
      await refreshTypes();
    } catch (error) {
      console.error(`Failed to load ${typeName}.${fieldName}:`, error);
    } finally {
      setLoadingField(null);
    }
  };

  const onPresetSelect = async (preset: AvailablePreset) => {
    setLoadingPreset(preset.path);
    try {
      setPlots(
        preset.fields.map((field) => ({
          messageType: field.messageType,
          field: field.field,
          instance: field.instance,
          yAxis: field.yAxis,
        })),
      );

      await loadPlotFields(
        backend,
        prefetchFieldSeries,
        preset.fields.map((field) => ({
          messageType: field.messageType,
          field: field.field,
          instance: field.instance,
        })),
      );
      await refreshTypes();
    } catch (error) {
      console.error(`Failed to load preset ${preset.path}:`, error);
    } finally {
      setLoadingPreset(null);
    }
  };

  const isFieldPlotted = (typeName: string, fieldName: string) => {
    const { baseName, instance } = parseTypeName(typeName);
    return activePlots.some((p) => p.id === plotId(baseName, fieldName, instance));
  };

  return (
    <Stack gap="sm" h="100%">
      {activePlots.length > 0 && (
        <Box pb="sm" style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
          <Group justify="space-between" mb="xs">
            <Group gap={6}>
              <IconChartLine size={14} />
              <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                Active plots ({activePlots.length})
              </Text>
            </Group>
            <Button variant="subtle" size="compact-xs" onClick={clearPlots}>
              Clear all
            </Button>
          </Group>
          <Group gap={6}>
            {activePlots.map((plot) => (
              <Badge
                key={plot.id}
                variant="outline"
                leftSection={
                  <Box
                    w={8}
                    h={8}
                    style={{ borderRadius: "50%", backgroundColor: plot.color }}
                  />
                }
                rightSection={
                  <Group gap={2}>
                    <UnstyledButton
                      onClick={() => togglePlotAxis(plot.id)}
                      title="Toggle Y axis"
                      style={{ fontSize: 10, opacity: 0.8 }}
                    >
                      Y{plot.yAxis}
                    </UnstyledButton>
                    <ActionIcon
                      size="xs"
                      variant="transparent"
                      onClick={() => removePlot(plot.id)}
                      aria-label="Remove plot"
                    >
                      <IconX size={10} />
                    </ActionIcon>
                  </Group>
                }
                styles={{ root: { fontFamily: "var(--mantine-font-family-monospace)" } }}
              >
                {plot.id}
              </Badge>
            ))}
          </Group>
        </Box>
      )}

      <PresetTree
        nodes={presetTree}
        onSelect={(preset) => void onPresetSelect(preset)}
        loadingPreset={loadingPreset}
      />

      <TextInput
        placeholder="Filter types or fields…"
        leftSection={<IconSearch size={14} />}
        rightSection={
          filter ? (
            <ActionIcon size="sm" variant="subtle" onClick={() => setFilter("")}>
              <IconX size={14} />
            </ActionIcon>
          ) : null
        }
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <Group justify="space-between">
        <Text size="xs" c="dimmed">
          Showing {filtered.length} types
        </Text>
        <Button
          variant="subtle"
          size="compact-xs"
          onClick={() => setHideSystem(!hideSystem)}
        >
          {hideSystem ? "Show system" : "Hide system"}
        </Button>
      </Group>

      <ScrollArea flex={1} offsetScrollbars type="auto">
        <Stack gap={2}>
          {filtered.map((type) => {
            const isOpen = expanded[type.name] ?? false;
            const sortedFields = [...type.fields].sort((a, b) =>
              a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
            );
            return (
              <Box key={type.name}>
                <UnstyledButton
                  w="100%"
                  p={6}
                  style={{ borderRadius: "var(--mantine-radius-sm)" }}
                  onClick={() => setExpanded((s) => ({ ...s, [type.name]: !isOpen }))}
                >
                  <Group gap={8} wrap="nowrap">
                    {isOpen ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                    <Text size="sm" ff="monospace" fw={600} style={{ flex: 1 }}>
                      {type.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {type.count.toLocaleString()}
                    </Text>
                    {type.loaded && (
                      <Badge size="xs" variant="light" color="cyan">
                        loaded
                      </Badge>
                    )}
                  </Group>
                </UnstyledButton>
                {isOpen && (
                  <Stack gap={2} pl={20} ml={8} style={{ borderLeft: "1px solid var(--mantine-color-default-border)" }}>
                    {sortedFields.map((field) => {
                      const { baseName, instance } = parseTypeName(type.name);
                      const active = isFieldPlotted(type.name, field.name);
                      const fieldKey = plotId(baseName, field.name, instance);
                      return (
                        <UnstyledButton
                          key={field.name}
                          w="100%"
                          p={6}
                          disabled={loadingField === fieldKey}
                          onClick={() => void onFieldClick(type.name, field.name)}
                          style={{
                            borderRadius: "var(--mantine-radius-sm)",
                            backgroundColor: active
                              ? "var(--mantine-color-orange-light)"
                              : undefined,
                            color: active ? "var(--mantine-color-orange-7)" : undefined,
                          }}
                        >
                          <Group justify="space-between" wrap="nowrap">
                            <Text size="xs" ff="monospace">
                              {field.name}
                            </Text>
                            {field.units && (
                              <Text size="xs" c="dimmed">
                                {field.units}
                              </Text>
                            )}
                          </Group>
                        </UnstyledButton>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            );
          })}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}
