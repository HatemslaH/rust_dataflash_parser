import { useState } from "react";
import {
  IconSun,
  IconMoon,
  IconChevronLeft,
  IconChevronRight,
  IconChartLine,
  IconDots,
  IconRefresh,
  IconPlane,
} from "@tabler/icons-react";
import {
  AppShell as MantineAppShell,
  ActionIcon,
  Box,
  Center,
  Group,
  SegmentedControl,
  Stack,
  Text,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { FileOpenPanel } from "./FileOpenPanel";
import { MessageTree } from "./MessageTree";
import { MorePanel } from "./MorePanel";
import { PlotChart } from "./PlotChart";
import { MapView } from "./MapView";
import { AttitudeWidget } from "./AttitudeWidget";
import { useSessionStore } from "../stores/sessionStore";
import { getParserBackend } from "../platform";
import { resetViewerData } from "../lib/sessionReset";

type SidebarTab = "plot" | "more";

export function AppShell() {
  const [tab, setTab] = useState<SidebarTab>("plot");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("dark");

  const summary = useSessionStore((s) => s.summary);
  const processDone = useSessionStore((s) => s.processDone);
  const showPlot = useSessionStore((s) => s.showPlot);
  const showMap = useSessionStore((s) => s.showMap);
  const reset = useSessionStore((s) => s.reset);
  const backend = getParserBackend();

  const handleCloseLog = async () => {
    try {
      await backend.closeLog();
      resetViewerData();
      reset();
      setTab("plot");
    } catch (err) {
      console.error("Failed to close log:", err);
    }
  };

  const onLogOpened = () => {
    setTab("plot");
  };

  const toggleTheme = () => {
    setColorScheme(computedColorScheme === "dark" ? "light" : "dark");
  };

  const plotFlex = showMap ? 1 : 1;
  const mapFlex = showPlot ? 1 : 1;

  return (
    <>
      <AttitudeWidget />

      <MantineAppShell
        navbar={{
          width: sidebarCollapsed ? 56 : 280,
          breakpoint: "sm",
        }}
        padding={0}
      >
        <MantineAppShell.Navbar p={sidebarCollapsed ? "xs" : "md"}>
          <Stack gap="sm" h="100%">
            <Group gap="sm" justify={sidebarCollapsed ? "center" : "flex-start"} wrap="nowrap">
              <IconPlane size={18} color="var(--mantine-color-orange-6)" />
              {!sidebarCollapsed && (
                <Text size="sm" fw={600}>
                  Dataflash Viewer
                </Text>
              )}
            </Group>

            {summary && !sidebarCollapsed && (
              <Text size="xs" c="dimmed" lineClamp={1} title={summary.fileName}>
                {summary.fileName}
              </Text>
            )}

            {processDone && !sidebarCollapsed && (
              <SegmentedControl
                value={tab}
                onChange={(value) => setTab(value as SidebarTab)}
                data={[
                  {
                    value: "plot",
                    label: (
                      <Center style={{ gap: 6 }}>
                        <IconChartLine size={14} />
                        <span>Plot</span>
                      </Center>
                    ),
                  },
                  {
                    value: "more",
                    label: (
                      <Center style={{ gap: 6 }}>
                        <IconDots size={14} />
                        <span>More</span>
                      </Center>
                    ),
                  },
                ]}
                fullWidth
              />
            )}

            <Box style={{ flex: 1, overflow: "auto", minHeight: 0, display: sidebarCollapsed ? "none" : undefined }}>
              {!processDone && <FileOpenPanel onLogOpened={onLogOpened} />}
              {processDone && tab === "plot" && <MessageTree />}
              {processDone && tab === "more" && <MorePanel />}
            </Box>

            <Group gap={6} justify="flex-end" mt="auto">
              <ActionIcon variant="default" onClick={toggleTheme}>
                {computedColorScheme === "dark" ? <IconSun size={16} /> : <IconMoon size={16} />}
              </ActionIcon>
              {summary && (
                <Tooltip label="Close current log">
                  <ActionIcon variant="default" onClick={() => void handleCloseLog()}>
                    <IconRefresh size={16} />
                  </ActionIcon>
                </Tooltip>
              )}
              <ActionIcon
                variant="default"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {sidebarCollapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
              </ActionIcon>
            </Group>
          </Stack>
        </MantineAppShell.Navbar>

        <MantineAppShell.Main>
          <Stack gap={0} h="100vh">
            {showPlot && (
              <Box style={{ flex: plotFlex, minHeight: 0, display: "flex", flexDirection: "column" }}>
                <PlotChart />
              </Box>
            )}
            {showMap && (
              <Box style={{ flex: mapFlex, minHeight: 0, display: "flex", flexDirection: "column" }}>
                <MapView />
              </Box>
            )}
            {!showPlot && !showMap && (
              <Center flex={1} p="xl">
                <Stack align="center" gap="xs">
                  <Text c="dimmed">All panels hidden</Text>
                  <Text size="sm" c="dimmed">
                    Enable charts or map in the More tab.
                  </Text>
                </Stack>
              </Center>
            )}
          </Stack>
        </MantineAppShell.Main>
      </MantineAppShell>
    </>
  );
}
