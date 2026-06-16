import { useAttitudeAtTime } from "../hooks/useFieldSeries";
import { useSessionStore } from "../stores/sessionStore";
import { useTimeStore } from "../stores/timeStore";
import { IconX } from "@tabler/icons-react";

export function AttitudeWidget() {
  const summary = useSessionStore((s) => s.summary);
  const showAttitude = useSessionStore((s) => s.showAttitude);
  const setShowAttitude = useSessionStore((s) => s.setShowAttitude);
  const hoveredTimeMs = useTimeStore((s) => s.hoveredTimeMs);
  const { roll, pitch, yaw } = useAttitudeAtTime(hoveredTimeMs, summary !== null && showAttitude);

  if (!showAttitude || !summary) return null;

  return (
    <div className="floating-widget attitude-widget">
      <header className="widget-header">
        <span>Attitude</span>
        <button
          type="button"
          className="widget-close"
          onClick={() => setShowAttitude(false)}
          aria-label="Close"
        >
          <IconX size={14} />
        </button>
      </header>
      <div className="attitude-body">
        <div
          className="attitude-horizon"
          style={{
            transform: `rotate(${roll}deg)`,
          }}
        >
          <div
            className="attitude-sky"
            style={{ transform: `translateY(${pitch * 1.2}px)` }}
          />
          <div
            className="attitude-ground"
            style={{ transform: `translateY(${pitch * 1.2}px)` }}
          />
          <div className="attitude-crosshair" />
        </div>
        <dl className="attitude-readout">
          <div>
            <dt>Roll</dt>
            <dd>{roll.toFixed(1)}°</dd>
          </div>
          <div>
            <dt>Pitch</dt>
            <dd>{pitch.toFixed(1)}°</dd>
          </div>
          <div>
            <dt>Yaw</dt>
            <dd>{yaw.toFixed(1)}°</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
