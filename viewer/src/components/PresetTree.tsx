import { useState } from "react";
import { IconChevronDown, IconChevronRight, IconList } from "@tabler/icons-react";
import { Box, Group, Stack, Text, UnstyledButton } from "@mantine/core";
import type { PresetTreeNode } from "../lib/plotPresets";
import type { AvailablePreset } from "../lib/plotPresets";

interface PresetTreeProps {
  nodes: PresetTreeNode[];
  onSelect: (preset: AvailablePreset) => void;
  loadingPreset: string | null;
}

function PresetTreeLevel({ nodes, onSelect, loadingPreset, depth = 0 }: PresetTreeProps & { depth?: number }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <Stack gap={2} pl={depth > 0 ? 12 : 0}>
      {nodes.map((node) => {
        if (node.kind === "group") {
          const isOpen = expanded[node.name] ?? false;
          return (
            <Box key={node.name}>
              <UnstyledButton
                w="100%"
                p={6}
                style={{ borderRadius: "var(--mantine-radius-sm)" }}
                onClick={() => setExpanded((state) => ({ ...state, [node.name]: !isOpen }))}
              >
                <Group gap={8} wrap="nowrap">
                  {isOpen ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                  <Text size="sm" fw={600} style={{ flex: 1 }}>
                    {node.name}
                  </Text>
                </Group>
              </UnstyledButton>
              {isOpen && (
                <PresetTreeLevel
                  nodes={node.children}
                  onSelect={onSelect}
                  loadingPreset={loadingPreset}
                  depth={depth + 1}
                />
              )}
            </Box>
          );
        }

        const isLoading = loadingPreset === node.preset.path;
        return (
          <UnstyledButton
            key={node.preset.path}
            w="100%"
            p={6}
            disabled={isLoading}
            style={{ borderRadius: "var(--mantine-radius-sm)" }}
            onClick={() => onSelect(node.preset)}
          >
            <Text size="xs" ff="monospace" c={isLoading ? "dimmed" : undefined}>
              {node.name}
            </Text>
          </UnstyledButton>
        );
      })}
    </Stack>
  );
}

export function PresetTree({ nodes, onSelect, loadingPreset }: PresetTreeProps) {
  const [sectionOpen, setSectionOpen] = useState(true);

  if (nodes.length === 0) return null;

  return (
    <Box pb="sm" style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
      <UnstyledButton
        w="100%"
        p={6}
        mb={4}
        style={{ borderRadius: "var(--mantine-radius-sm)" }}
        onClick={() => setSectionOpen((open) => !open)}
      >
        <Group gap={8} wrap="nowrap">
          {sectionOpen ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
          <IconList size={14} />
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ flex: 1 }}>
            Presets
          </Text>
        </Group>
      </UnstyledButton>
      {sectionOpen && (
        <PresetTreeLevel nodes={nodes} onSelect={onSelect} loadingPreset={loadingPreset} />
      )}
    </Box>
  );
}
