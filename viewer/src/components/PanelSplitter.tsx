import { useCallback, useRef, useState, type ReactNode } from "react";
import { Box } from "@mantine/core";

const MIN_RATIO = 0.15;
const MAX_RATIO = 0.85;
const DEFAULT_RATIO = 0.5;
const MIN_PANEL_PX = 80;

interface PanelSplitterProps {
  top: ReactNode;
  bottom: ReactNode;
  initialRatio?: number;
}

export function PanelSplitter({ top, bottom, initialRatio = DEFAULT_RATIO }: PanelSplitterProps) {
  const [ratio, setRatio] = useState(initialRatio);
  const containerRef = useRef<HTMLDivElement>(null);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const height = rect.height;
      if (height <= MIN_PANEL_PX * 2) return;

      const raw = (moveEvent.clientY - rect.top) / height;
      const minRatio = MIN_PANEL_PX / height;
      const maxRatio = 1 - MIN_PANEL_PX / height;
      const clamped = Math.min(Math.max(raw, minRatio, MIN_RATIO), maxRatio, MAX_RATIO);
      setRatio(clamped);
    };

    const onPointerUp = () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, []);

  return (
    <Box
      ref={containerRef}
      style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
    >
      <Box
        style={{
          flex: ratio,
          minHeight: MIN_PANEL_PX,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {top}
      </Box>
      <Box
        className="panel-splitter"
        onPointerDown={onPointerDown}
        role="separator"
        aria-orientation="horizontal"
        aria-valuenow={Math.round(ratio * 100)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            setRatio((r) => Math.max(MIN_RATIO, r - 0.05));
          }
          if (e.key === "ArrowDown") {
            setRatio((r) => Math.min(MAX_RATIO, r + 0.05));
          }
        }}
      />
      <Box
        style={{
          flex: 1 - ratio,
          minHeight: MIN_PANEL_PX,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {bottom}
      </Box>
    </Box>
  );
}
