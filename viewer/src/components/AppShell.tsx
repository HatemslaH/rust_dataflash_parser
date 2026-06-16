import { useEffect, useState } from "react";
import {
  IconSun,
  IconMoon,
  IconChevronLeft,
  IconChevronRight,
  IconHome,
  IconChartLine,
  IconDots,
  IconRefresh,
  IconPlane,
} from "@tabler/icons-react";
import { FileOpenPanel } from "./FileOpenPanel";
import { MessageTree } from "./MessageTree";
import { MorePanel } from "./MorePanel";
import { PlotChart } from "./PlotChart";
import { MapView } from "./MapView";
import { AttitudeWidget } from "./AttitudeWidget";
import { useSessionStore } from "../stores/sessionStore";
import { getParserBackend } from "../platform";
import { resetViewerData } from "../lib/sessionReset";

type SidebarTab = "home" | "plot" | "more";

export function AppShell() {
  const [tab, setTab] = useState<SidebarTab>("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const theme = useSessionStore((s) => s.theme);
  const setTheme = useSessionStore((s) => s.setTheme);
  const summary = useSessionStore((s) => s.summary);
  const processDone = useSessionStore((s) => s.processDone);
  const showPlot = useSessionStore((s) => s.showPlot);
  const showMap = useSessionStore((s) => s.showMap);
  const reset = useSessionStore((s) => s.reset);
  const backend = getParserBackend();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const handleCloseLog = async () => {
    try {
      await backend.closeLog();
      resetViewerData();
      reset();
      setTab("home");
    } catch (err) {
      console.error("Failed to close log:", err);
    }
  };

  const onLogOpened = () => {
    setTab("plot");
  };

  const plotRowClass = showMap ? "half" : "full";
  const mapRowClass = showPlot ? "half" : "full";

  return (
    <div className="app-shell">
      <AttitudeWidget />

      <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <header className="sidebar-brand">
          <IconPlane size={18} className="brand-plane" />
          {!sidebarCollapsed && (
            <span>
              <b>Dataflash</b> Viewer
            </span>
          )}
        </header>

        {summary && !sidebarCollapsed && (
          <p className="filename" title={summary.fileName}>
            {summary.fileName}
          </p>
        )}

        <nav className="sidebar-tabs" aria-label="Sidebar">
          {(processDone
            ? ([
                ["plot", "Plot", IconChartLine],
                ["more", "More", IconDots],
              ] as const)
            : ([["home", "Home", IconHome]] as const)
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              className={tab === id ? "tab active" : "tab"}
              onClick={() => setTab(id)}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon size={16} />
              {!sidebarCollapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-content">
          {tab === "home" && <FileOpenPanel onLogOpened={onLogOpened} />}
          {tab === "plot" && processDone && <MessageTree />}
          {tab === "more" && processDone && <MorePanel />}
        </div>

        <div className="sidebar-footer">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? <IconSun size={16} /> : <IconMoon size={16} />}
          </button>
          {summary && (
            <button
              type="button"
              className="icon-btn"
              onClick={() => void handleCloseLog()}
              title="Close current log"
            >
              <IconRefresh size={16} />
            </button>
          )}
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      <main className="main">
        {showPlot && (
          <section className={`panel chart-panel row-${plotRowClass}`}>
            <PlotChart />
          </section>
        )}
        {showMap && (
          <section className={`panel map-panel row-${mapRowClass}`}>
            <MapView />
          </section>
        )}
        {!showPlot && !showMap && (
          <section className="panel panel-empty">
            <div className="panel-placeholder">
              <p>All panels hidden</p>
              <p className="muted">Enable charts or map in the More tab.</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
