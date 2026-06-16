import { useAttitudeAtTime } from "../hooks/useFieldSeries";
import { useSessionStore } from "../stores/sessionStore";
import { useTimeStore } from "../stores/timeStore";
import { IconX } from "@tabler/icons-react";
import { ActionIcon, Group, Paper, SimpleGrid, Text } from "@mantine/core";

export function AttitudeWidget() {
  const summary = useSessionStore((s) => s.summary);
  const showAttitude = useSessionStore((s) => s.showAttitude);
  const setShowAttitude = useSessionStore((s) => s.setShowAttitude);
  const hoveredTimeMs = useTimeStore((s) => s.hoveredTimeMs);
  const { roll, pitch, yaw } = useAttitudeAtTime(hoveredTimeMs, summary !== null && showAttitude);

  if (!showAttitude || !summary) return null;

  return (
    <Paper
      shadow="md"
      radius="md"
      withBorder
      pos="fixed"
      top={72}
      right={24}
      w={220}
      style={{ zIndex: 100 }}
    >
      <Group justify="space-between" p="xs" style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
        <Text size="sm" fw={700}>
          Attitude
        </Text>
        <ActionIcon
          variant="subtle"
          size="sm"
          onClick={() => setShowAttitude(false)}
          aria-label="Close"
        >
          <IconX size={14} />
        </ActionIcon>
      </Group>
      <div className="attitude-body">
        <div
          className="attitude-horizon"
          style={{
            transform: `rotate(${roll}deg)`,
          }}
        >
          <div
            className="attitude-sky"
            style={{ transform: `translateY(${pitch * 1.2}px)` }}
          />
          <div
            className="attitude-ground"
            style={{ transform: `translateY(${pitch * 1.2}px)` }}
          />
          <div className="attitude-crosshair" />
        </div>
        <SimpleGrid cols={3} spacing="xs" p="xs" pt={0}>
          <StackItem label="Roll" value={`${roll.toFixed(1)}°`} />
          <StackItem label="Pitch" value={`${pitch.toFixed(1)}°`} />
          <StackItem label="Yaw" value={`${yaw.toFixed(1)}°`} />
        </SimpleGrid>
      </div>
    </Paper>
  );
}

function StackItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="xs" ff="monospace" mt={2}>
        {value}
      </Text>
    </div>
  );
}
