import { useRef, type ChangeEvent, type DragEvent } from "react";
import {
  IconCloudUpload,
  IconInfoCircle,
  IconPlayerPlay,
} from "@tabler/icons-react";
import {
  Button,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { getParserBackend } from "../platform";
import { useSessionStore } from "../stores/sessionStore";
import { resetViewerData } from "../lib/sessionReset";

interface FileOpenPanelProps {
  onLogOpened?: () => void;
}

export function FileOpenPanel({ onLogOpened }: FileOpenPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const summary = useSessionStore((s) => s.summary);
  const progress = useSessionStore((s) => s.progress);
  const setSummary = useSessionStore((s) => s.setSummary);
  const setProgress = useSessionStore((s) => s.setProgress);
  const backend = getParserBackend();

  const openFile = async (file: File | string) => {
    const isString = typeof file === "string";
    const name = isString ? file.split(/[/\\]/).pop() || file : file.name;

    if (!name.toLowerCase().endsWith(".bin")) {
      setProgress({ phase: "error", percent: 0, message: "Only .BIN dataflash logs are supported" });
      return;
    }

    try {
      resetViewerData();
      setProgress({ phase: "indexing", percent: 5, message: "Opening log..." });
      const result = await backend.openFile(file);
      setSummary(result);
      onLogOpened?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setProgress({ phase: "error", percent: 0, message });
    }
  };

  const loadDemo = async () => {
    await openFile("demo-flight.bin");
  };

  const onBrowse = () => inputRef.current?.click();

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void openFile(file);
    }
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      void openFile(file);
    }
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <Stack gap="md">
      <Paper
        withBorder
        radius="md"
        p="xl"
        style={{ cursor: "pointer", borderStyle: "dashed" }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onClick={onBrowse}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onBrowse()}
      >
        <Stack align="center" gap="xs">
          <ThemeIcon variant="light" size="xl" radius="xl">
            <IconCloudUpload size={28} stroke={1.5} />
          </ThemeIcon>
          <Text fw={600}>Drop .BIN file here</Text>
          <Text size="sm" c="dimmed">
            or click to browse
          </Text>
        </Stack>
        <input
          ref={inputRef}
          type="file"
          accept=".bin,.BIN"
          hidden
          onChange={onInputChange}
        />
      </Paper>

      <Button
        variant="light"
        leftSection={<IconPlayerPlay size={16} />}
        onClick={() => void loadDemo()}
        fullWidth
      >
        Load sample log
      </Button>

      <Stack gap={6}>
        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            Status
          </Text>
          <Text size="xs" c="dimmed">
            {progress.percent}%
          </Text>
        </Group>
        <Progress value={progress.percent} size="sm" radius="xl" />
        <Text
          size="sm"
          c={progress.phase === "error" ? "red" : "dimmed"}
          lineClamp={2}
          title={progress.message}
        >
          {progress.message}
        </Text>
      </Stack>

      {summary && (
        <Paper withBorder radius="md" p="sm">
          <Group gap={6} mb="xs">
            <IconInfoCircle size={14} />
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              Log metadata
            </Text>
          </Group>
          <Stack gap={6}>
            <MetadataRow label="File" value={summary.fileName} />
            <MetadataRow label="Size" value={formatBytes(summary.fileSize)} />
            <MetadataRow label="Message types" value={String(summary.messageTypeCount)} />
            {summary.startTime && (
              <MetadataRow
                label="Start time"
                value={new Date(summary.startTime).toLocaleString()}
              />
            )}
            <MetadataRow label="Backend" value={`rust parser (${backend.platform})`} />
          </Stack>
        </Paper>
      )}

      <Text size="xs" c="dimmed">
        Dataflash Viewer — Rust parser in WebAssembly
      </Text>
    </Stack>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between" gap="sm" wrap="nowrap">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="xs" ff="monospace" ta="right" lineClamp={1} title={value}>
        {value}
      </Text>
    </Group>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exp;
  return `${value.toFixed(exp === 0 ? 0 : 1)} ${units[exp]}`;
}
