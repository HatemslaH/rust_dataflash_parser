import { useRef, type ChangeEvent, type DragEvent } from "react";
import { UploadCloud, FileCode, History, Info } from "lucide-react";
import { getParserBackend } from "../platform";
import { useSessionStore } from "../stores/session";

export function FileOpenPanel() {
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
      setProgress({ phase: "indexing", percent: 5, message: "Opening log..." });
      const result = await backend.openFile(file);
      setSummary(result);

      // Save to recent files list
      const path = isString ? file : ("path" in file ? (file as any).path : undefined);
      addRecentFile({
        name,
        size: isString ? result.fileSize : file.size,
        path,
      });
    } catch (error: any) {
      setProgress({
        phase: "error",
        percent: 0,
        message: error.message || String(error),
      });
    }
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

  const onRecentClick = (file: typeof recentFiles[0]) => {
    if (backend.platform === "desktop" && file.path) {
      void openFile(file.path);
    } else {
      setProgress({
        phase: "error",
        percent: 0,
        message: `To open "${file.name}" in the web browser, please drag and drop the file directly.`,
      });
    }
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
        <UploadCloud className="dropzone-icon" size={32} />
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
        <div className="progress-info">
          <span>Status</span>
          <span>{progress.percent}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
        </div>
        <p className="progress-text" title={progress.message}>
          {progress.message}
        </p>
      </div>

      {summary && (
        <div className="meta-card-container">
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
            <Info size={12} />
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
                <dt>Start Time</dt>
                <dd>{new Date(summary.startTime).toLocaleString()}</dd>
              </div>
            )}
            <div>
              <dt>Platform</dt>
              <dd style={{ textTransform: "capitalize" }}>{backend.platform}</dd>
            </div>
          </dl>
        </div>
      )}

      {recentFiles.length > 0 && (
        <div className="recent-files">
          <div className="recent-files-header">
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <History size={12} />
              <span>Recent Files</span>
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
                  onClick={() => onRecentClick(file)}
                  title={file.path || file.name}
                >
                  <div className="recent-file-info">
                    <span className="recent-file-name">{file.name}</span>
                    <span className="recent-file-meta">
                      <span>{formatBytes(file.size)}</span>
                      {file.path && <span style={{ opacity: 0.6, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{file.path}</span>}
                    </span>
                  </div>
                  <FileCode size={14} className="muted" style={{ flexShrink: 0, marginLeft: "8px" }} />
                </button>
              </li>
            ))}
          </ul>
        </div>
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
