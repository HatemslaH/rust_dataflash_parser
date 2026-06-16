import { useEffect, useState } from "react";
import {
  IconSearch,
  IconX,
  IconChevronDown,
  IconChevronRight,
  IconChartLine,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { getParserBackend } from "../platform";
import type { MessageTypeEntry } from "../platform/types";
import { useSessionStore } from "../stores/sessionStore";
import { usePlotStore } from "../stores/plotStore";
import { usePrefetchFieldSeries } from "../hooks/useFieldSeries";
import { TIME_FIELD } from "../lib/seriesValues";
import { parseTypeName, plotId } from "../lib/fieldSeriesKey";

const SYSTEM_TYPES = ["FMT", "FMTU", "MULT", "UNIT"];

export function MessageTree() {
  const summary = useSessionStore((s) => s.summary);
  const [types, setTypes] = useState<MessageTypeEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [hideSystem, setHideSystem] = useState(true);
  const [loadingField, setLoadingField] = useState<string | null>(null);
  const backend = getParserBackend();
  const prefetchFieldSeries = usePrefetchFieldSeries();

  const activePlots = usePlotStore((s) => s.activePlots);
  const addPlot = usePlotStore((s) => s.addPlot);
  const removePlot = usePlotStore((s) => s.removePlot);
  const clearPlots = usePlotStore((s) => s.clearPlots);
  const togglePlotAxis = usePlotStore((s) => s.togglePlotAxis);

  useEffect(() => {
    if (!summary) return;
    void backend.listMessageTypes().then(setTypes);
  }, [summary, backend]);

  if (!summary) {
    return <p className="empty-hint">Open a log to browse message types.</p>;
  }

  const needle = filter.trim().toLowerCase();
  const filtered = types.filter((type) => {
    if (hideSystem && SYSTEM_TYPES.includes(type.name)) return false;
    if (!needle) return true;
    if (type.name.toLowerCase().includes(needle)) return true;
    return type.fields.some((f) => f.name.toLowerCase().includes(needle));
  });

  const onFieldClick = async (typeName: string, fieldName: string) => {
    const { baseName, instance } = parseTypeName(typeName);
    const fieldKey = plotId(baseName, fieldName, instance);

    addPlot({ messageType: baseName, field: fieldName, instance });

    setLoadingField(fieldKey);
    try {
      await backend.loadMessageTypes([typeName]);
      const updatedTypes = await backend.listMessageTypes();
      setTypes(updatedTypes);

      const baseReq = { messageType: baseName, instance };
      await Promise.all([
        prefetchFieldSeries({ ...baseReq, field: TIME_FIELD }),
        prefetchFieldSeries({ ...baseReq, field: fieldName }),
      ]);
    } catch (error) {
      console.error(`Failed to load ${typeName}.${fieldName}:`, error);
    } finally {
      setLoadingField(null);
    }
  };

  const isFieldPlotted = (typeName: string, fieldName: string) => {
    const { baseName, instance } = parseTypeName(typeName);
    return activePlots.some((p) => p.id === plotId(baseName, fieldName, instance));
  };

  return (
    <div className="message-tree-container">
      {activePlots.length > 0 && (
        <div className="active-plots">
          <div className="active-plots-header">
            <div className="active-plots-title">
              <IconChartLine size={12} />
              <span>Active plots ({activePlots.length})</span>
            </div>
            <button type="button" className="clear-btn" onClick={clearPlots}>
              Clear all
            </button>
          </div>
          <ul className="active-plots-list">
            {activePlots.map((plot) => (
              <li key={plot.id}>
                <span className="active-plot-badge">
                  <span className="active-plot-color" style={{ backgroundColor: plot.color }} />
                  <span>{plot.id}</span>
                  <button
                    type="button"
                    className="axis-badge"
                    onClick={() => togglePlotAxis(plot.id)}
                    title="Toggle Y axis"
                  >
                    Y{plot.yAxis}
                  </button>
                  <button
                    type="button"
                    className="active-plot-remove"
                    onClick={() => removePlot(plot.id)}
                    title="Remove plot"
                  >
                    <IconX size={10} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="search-container">
        <IconSearch className="search-icon" size={14} />
        <input
          className="search-input"
          placeholder="Filter types or fields…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        {filter && (
          <button type="button" className="search-clear" onClick={() => setFilter("")}>
            <IconX size={14} />
          </button>
        )}
      </div>

      <div className="tree-toolbar">
        <span>Showing {filtered.length} types</span>
        <button
          type="button"
          className="toggle-container"
          onClick={() => setHideSystem(!hideSystem)}
        >
          {hideSystem ? <IconEyeOff size={12} /> : <IconEye size={12} />}
          <span>{hideSystem ? "Hide system" : "Show system"}</span>
        </button>
      </div>

      <div className="message-tree">
        <ul className="tree-root">
          {filtered.map((type) => {
            const isOpen = expanded[type.name] ?? false;
            return (
              <li key={type.name} className="tree-type">
                <button
                  type="button"
                  className="tree-type-btn"
                  onClick={() => setExpanded((s) => ({ ...s, [type.name]: !isOpen }))}
                >
                  <span className="chevron">
                    {isOpen ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                  </span>
                  <span className="type-name">{type.name}</span>
                  <span className="type-count">{type.count.toLocaleString()}</span>
                  {type.loaded && <span className="badge-loaded">loaded</span>}
                </button>
                {isOpen && (
                  <ul className="tree-fields">
                    {type.fields.map((field) => {
                      const { baseName, instance } = parseTypeName(type.name);
                      const active = isFieldPlotted(type.name, field.name);
                      const fieldKey = plotId(baseName, field.name, instance);
                      return (
                        <li key={field.name}>
                          <button
                            type="button"
                            className={`field-btn ${active ? "active" : ""}`}
                            onClick={() => void onFieldClick(type.name, field.name)}
                            disabled={loadingField === fieldKey}
                          >
                            <span>{field.name}</span>
                            {field.units && <span className="field-units">{field.units}</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
