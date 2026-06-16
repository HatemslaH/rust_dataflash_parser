import { useRef, type ChangeEvent, type DragEvent } from "react";
import {
  IconCloudUpload,
  IconFileCode,
  IconHistory,
  IconInfoCircle,
  IconPlayerPlay,
} from "@tabler/icons-react";
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
  const recentFiles = useSessionStore((s) => s.recentFiles);
  const setSummary = useSessionStore((s) => s.setSummary);
  const setProgress = useSessionStore((s) => s.setProgress);
  const addRecentFile = useSessionStore((s) => s.addRecentFile);
  const clearRecentFiles = useSessionStore((s) => s.clearRecentFiles);
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
      addRecentFile({
        name,
        size: isString ? result.fileSize : file.size,
      });
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
    <div className="file-open">
      <div
        className="dropzone"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onClick={onBrowse}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onBrowse()}
      >
        <IconCloudUpload className="dropzone-icon" size={32} stroke={1.5} />
        <p className="dropzone-title">Drop .BIN file here</p>
        <p className="dropzone-hint">or click to browse</p>
        <input
          ref={inputRef}
          type="file"
          accept=".bin,.BIN"
          hidden
          onChange={onInputChange}
        />
      </div>

      <button type="button" className="demo-btn" onClick={() => void loadDemo()}>
        <IconPlayerPlay size={16} />
        Load demo log (mock data)
      </button>

      <div className="progress-block">
        <div className="progress-info">
          <span>Status</span>
          <span>{progress.percent}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
        </div>
        <p className={`progress-text ${progress.phase === "error" ? "error" : ""}`} title={progress.message}>
          {progress.message}
        </p>
      </div>

      {summary && (
        <div className="meta-card-container">
          <div className="meta-card-label">
            <IconInfoCircle size={12} />
            <span>Log Metadata</span>
          </div>
          <dl className="meta-card">
            <div>
              <dt>File</dt>
              <dd title={summary.fileName}>{summary.fileName}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{formatBytes(summary.fileSize)}</dd>
            </div>
            <div>
              <dt>Message types</dt>
              <dd>{summary.messageTypeCount}</dd>
            </div>
            {summary.startTime && (
              <div>
                <dt>Start time</dt>
                <dd>{new Date(summary.startTime).toLocaleString()}</dd>
              </div>
            )}
            <div>
              <dt>Backend</dt>
              <dd>mock ({backend.platform})</dd>
            </div>
          </dl>
        </div>
      )}

      {recentFiles.length > 0 && (
        <div className="recent-files">
          <div className="recent-files-header">
            <div className="recent-files-title">
              <IconHistory size={12} />
              <span>Recent files</span>
            </div>
            <button type="button" className="clear-btn" onClick={clearRecentFiles}>
              Clear
            </button>
          </div>
          <ul className="recent-files-list">
            {recentFiles.map((file, idx) => (
              <li key={`${file.name}-${idx}`}>
                <button
                  type="button"
                  className="recent-file-item"
                  onClick={() => void openFile(file.name)}
                  title={file.name}
                >
                  <div className="recent-file-info">
                    <span className="recent-file-name">{file.name}</span>
                    <span className="recent-file-meta">{formatBytes(file.size)}</span>
                  </div>
                  <IconFileCode size={14} className="muted" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="buildinfo">Dataflash Viewer — UI demo with mock parser</p>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exp;
  return `${value.toFixed(exp === 0 ? 0 : 1)} ${units[exp]}`;
}
