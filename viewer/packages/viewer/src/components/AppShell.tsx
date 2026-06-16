import { useState } from "react";
import { FileOpenPanel } from "./FileOpenPanel";
import { MessageTree } from "./MessageTree";

type SidebarTab = "home" | "plot" | "more";

export function AppShell() {
  const [tab, setTab] = useState<SidebarTab>("home");

  return (
    <div className="app-shell">
      <header className="titlebar">
        <div className="brand">
          <span className="brand-mark" />
          <span>Dataflash Viewer</span>
        </div>
        <span className="titlebar-hint">Phase 0 scaffold</span>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <nav className="sidebar-tabs" aria-label="Sidebar">
            {(
              [
                ["home", "Home"],
                ["plot", "Plot"],
                ["more", "More"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={tab === id ? "tab active" : "tab"}
                onClick={() => setTab(id)}
              >
                {label}
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
        </aside>

        <main className="main">
          <section className="panel chart-panel">
            <header className="panel-header">
              <h2>Charts</h2>
              <span className="panel-sub">Plotly integration — Phase 3</span>
            </header>
            <div className="panel-placeholder">
              <p>Time-series plot area</p>
              <p className="muted">Click a field in the Plot tab to load series (mock logs log to console).</p>
            </div>
          </section>

          <section className="panel map-panel">
            <header className="panel-header">
              <h2>Map</h2>
              <span className="panel-sub">MapLibre + deck.gl — Phase 4–5</span>
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
