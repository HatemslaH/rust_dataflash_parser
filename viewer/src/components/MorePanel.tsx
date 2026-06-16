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
    return <p className="empty-hint">Open a log to access view options.</p>;
  }

  return (
    <div className="more-panel">
      <h3 className="more-section-title">Show / hide</h3>
      <div className="show-hide-list">
        <label className="show-hide-item">
          <input type="checkbox" checked={showPlot} onChange={(e) => setShowPlot(e.target.checked)} />
          <span>Charts</span>
        </label>
        <label className="show-hide-item">
          <input type="checkbox" checked={showMap} onChange={(e) => setShowMap(e.target.checked)} />
          <span>Map (MapLibre + Three.js)</span>
        </label>
        <label className="show-hide-item">
          <input type="checkbox" checked={showAttitude} onChange={(e) => setShowAttitude(e.target.checked)} />
          <span>Attitude widget</span>
        </label>
      </div>

      <hr className="more-divider" />

      <p className="more-hint">
        Hover over the chart to sync the time cursor with the map and attitude instrument.
        Drag on the chart to zoom the time range.
      </p>
    </div>
  );
}
