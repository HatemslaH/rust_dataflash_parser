import { useRef, type ChangeEvent, type DragEvent } from "react";
import { getParserBackend } from "../platform";
import { useSessionStore } from "../stores/session";

export function FileOpenPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const summary = useSessionStore((s) => s.summary);
  const progress = useSessionStore((s) => s.progress);
  const setSummary = useSessionStore((s) => s.setSummary);
  const setProgress = useSessionStore((s) => s.setProgress);
  const backend = getParserBackend();

  const openFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".bin")) {
      setProgress({ phase: "error", percent: 0, message: "Only .BIN dataflash logs are supported" });
      return;
    }
    const result = await backend.openFile(file);
    setSummary(result);
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

      <div className="progress-block">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
        </div>
        <p className="progress-text">{progress.message}</p>
      </div>

      {summary && (
        <dl className="meta-card">
          <div>
            <dt>File</dt>
            <dd>{summary.file_name}</dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd>{formatBytes(summary.file_size)}</dd>
          </div>
          <div>
            <dt>Message types</dt>
            <dd>{summary.message_type_count}</dd>
          </div>
          <div>
            <dt>Platform</dt>
            <dd>{backend.platform}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "—";
  }
  const units = ["B", "KB", "MB", "GB"];
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exp;
  return `${value.toFixed(exp === 0 ? 0 : 1)} ${units[exp]}`;
}
