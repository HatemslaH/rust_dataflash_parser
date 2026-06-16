import { useState, useEffect } from "react";
import { Sun, Moon, ChevronLeft, ChevronRight, Home, Activity, MoreHorizontal, Settings, RefreshCw } from "lucide-react";
import { FileOpenPanel } from "./FileOpenPanel";
import { MessageTree } from "./MessageTree";
import { useSessionStore } from "../stores/session";
import { usePlotStore } from "../stores/plot";
import { getParserBackend } from "../platform";

type SidebarTab = "home" | "plot" | "more";

export function AppShell() {
  const [tab, setTab] = useState<SidebarTab>("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const theme = useSessionStore((s) => s.theme);
  const setTheme = useSessionStore((s) => s.setTheme);
  const summary = useSessionStore((s) => s.summary);
  const resetSession = useSessionStore((s) => s.reset);
  const activePlots = usePlotStore((s) => s.activePlots);
  const backend = getParserBackend();

  // Apply theme class to document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleCloseLog = async () => {
    try {
      await backend.closeLog();
      resetSession();
      setTab("home");
    } catch (err) {
      console.error("Failed to close log:", err);
    }
  };

  return (
    <div className="app-shell">
      <header className="titlebar">
        <div className="brand">
          <span className="brand-mark" />
          <span>Dataflash Viewer</span>
        </div>
        <div className="titlebar-actions">
          {summary && (
            <button
              type="button"
              className="icon-btn"
              onClick={handleCloseLog}
              title="Close current log"
            >
              <RefreshCw size={16} />
            </button>
          )}
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
          <nav className="sidebar-tabs" aria-label="Sidebar">
            {(
              [
                ["home", "Home", <Home size={16} />],
                ["plot", "Plot", <Activity size={16} />],
                ["more", "More", <MoreHorizontal size={16} />],
              ] as const
            ).map(([id, label, icon]) => (
              <button
                key={id}
                type="button"
                className={tab === id ? "tab active" : "tab"}
                onClick={() => setTab(id)}
                title={sidebarCollapsed ? label : undefined}
              >
                {icon}
                {!sidebarCollapsed && <span>{label}</span>}
              </button>
            ))}
          </nav>

          <div className="sidebar-content">
            {tab === "home" && <FileOpenPanel />}
            {tab === "plot" && <MessageTree />}
            {tab === "more" && (
              <div className="more-panel">
                <p className="empty-hint">Map, parameters, and export panels — coming in later phases.</p>
              </div>
            )}
          </div>

          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </aside>

        <main className="main">
          <section className="panel chart-panel">
            <header className="panel-header">
              <div className="panel-header-title">
                <h2>Charts</h2>
                <span className="panel-sub">Plotly integration — Phase 3</span>
              </div>
            </header>
            {activePlots.length === 0 ? (
              <div className="panel-placeholder">
                <p>Time-series plot area</p>
                <p className="muted">Click a field in the Plot tab to load series.</p>
              </div>
            ) : (
              <div className="chart-data-preview">
                <div className="preview-header">
                  <p className="preview-title">Loaded Series Preview (Phase 2 Data Verification)</p>
                  <p className="preview-subtitle">Plotly interactive charts will be fully integrated in Phase 3. The data below has been successfully parsed and is loaded in memory:</p>
                </div>
                <div className="preview-grid">
                  {activePlots.map((plot) => (
                    <div key={plot.id} className="preview-card" style={{ borderLeft: `3px solid ${plot.color}` }}>
                      <div className="preview-card-header">
                        <span className="preview-card-name">{plot.id}</span>
                        <span className="preview-card-count">
                          {plot.values ? `${plot.values.length.toLocaleString()} samples` : "Loading..."}
                        </span>
                      </div>
                      {plot.values && plot.values.length > 0 && (
                        <div className="preview-card-values">
                          <code>
                            [{plot.values.slice(0, 8).map(v => typeof v === 'number' ? v.toFixed(4) : String(v)).join(", ")}
                            {plot.values.length > 8 ? ", ..." : ""}]
                          </code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="panel map-panel">
            <header className="panel-header">
              <div className="panel-header-title">
                <h2>Map</h2>
                <span className="panel-sub">MapLibre + deck.gl — Phase 4–5</span>
              </div>
            </header>
            <div className="panel-placeholder">
              <p>3D trajectory map</p>
              <p className="muted">OpenFreeMap tiles, no API token required.</p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
