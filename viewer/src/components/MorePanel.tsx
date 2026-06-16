import { Checkbox, Divider, Stack, Text, Title } from "@mantine/core";
import { useSessionStore } from "../stores/sessionStore";

export function MorePanel() {
  const showPlot = useSessionStore((s) => s.showPlot);
  const showMap = useSessionStore((s) => s.showMap);
  const showAttitude = useSessionStore((s) => s.showAttitude);
  const setShowPlot = useSessionStore((s) => s.setShowPlot);
  const setShowMap = useSessionStore((s) => s.setShowMap);
  const setShowAttitude = useSessionStore((s) => s.setShowAttitude);
  const processDone = useSessionStore((s) => s.processDone);

  if (!processDone) {
    return (
      <Text size="sm" c="dimmed">
        Open a log to access view options.
      </Text>
    );
  }

  return (
    <Stack gap="md">
      <Title order={6} ta="center" tt="uppercase" c="dimmed">
        Show / hide
      </Title>
      <Stack gap="sm">
        <Checkbox
          label="Charts"
          checked={showPlot}
          onChange={(e) => setShowPlot(e.currentTarget.checked)}
        />
        <Checkbox
          label="Map (MapLibre + Three.js)"
          checked={showMap}
          onChange={(e) => setShowMap(e.currentTarget.checked)}
        />
        <Checkbox
          label="Attitude widget"
          checked={showAttitude}
          onChange={(e) => setShowAttitude(e.currentTarget.checked)}
        />
      </Stack>

      <Divider />

      <Text size="sm" c="dimmed">
        Hover over the chart to sync the time cursor with the map and attitude instrument.
        Drag on the chart to zoom the time range.
      </Text>
    </Stack>
  );
}
