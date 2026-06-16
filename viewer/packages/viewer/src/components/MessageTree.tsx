import { useEffect, useState } from "react";
import { Search, X, ChevronDown, ChevronRight, Activity, EyeOff, Eye } from "lucide-react";
import { getParserBackend } from "../platform";
import type { MessageTypeEntry } from "../platform/types";
import { useSessionStore } from "../stores/session";
import { usePlotStore } from "../stores/plot";

// System types that are usually hidden by default
const SYSTEM_TYPES = ["FMT", "FMTU", "MULT", "UNIT", "FMTU"];

export function MessageTree() {
  const summary = useSessionStore((s) => s.summary);
  const [types, setTypes] = useState<MessageTypeEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [hideSystem, setHideSystem] = useState(true);
  const backend = getParserBackend();

  // Plot store
  const activePlots = usePlotStore((s) => s.activePlots);
  const addPlot = usePlotStore((s) => s.addPlot);
  const updatePlotData = usePlotStore((s) => s.updatePlotData);
  const removePlot = usePlotStore((s) => s.removePlot);
  const clearPlots = usePlotStore((s) => s.clearPlots);

  useEffect(() => {
    if (!summary) {
      setTypes([]);
      return;
    }
    void backend.listMessageTypes().then(setTypes);
  }, [summary, backend]);

  if (!summary) {
    return <p className="empty-hint">Open a log to browse message types.</p>;
  }

  const needle = filter.trim().toLowerCase();
  const filtered = types.filter((type) => {
    // Filter out system types if requested
    if (hideSystem && SYSTEM_TYPES.includes(type.name)) {
      return false;
    }

    if (!needle) {
      return true;
    }
    if (type.name.toLowerCase().includes(needle)) {
      return true;
    }
    return type.fields.some((f) => f.name.toLowerCase().includes(needle));
  });

  const onFieldClick = async (typeName: string, fieldName: string) => {
    // Parse instance if name is like "GPS[0]"
    let baseName = typeName;
    let instance: number | undefined;
    const match = typeName.match(/^([^\[]+)\[(\d+)\]$/);
    if (match) {
      baseName = match[1]!;
      instance = parseInt(match[2]!, 10);
    }

    // Add to plot store
    addPlot({
      messageType: baseName,
      field: fieldName,
      instance,
    });

    // Trigger lazy load
    try {
      await backend.loadMessageTypes([typeName]);
      // Update types list to show "loaded" badge
      const updatedTypes = await backend.listMessageTypes();
      setTypes(updatedTypes);
      
      const series = await backend.getFieldSeries({
        messageType: baseName,
        field: fieldName,
        instance,
      });
      const id = instance !== undefined 
        ? `${baseName}[${instance}].${fieldName}`
        : `${baseName}.${fieldName}`;
      updatePlotData(id, series.values);
      console.info(`[plot] Loaded ${typeName}.${fieldName}`, series.values.length, "samples");
    } catch (error) {
      console.error(`Failed to load ${typeName}.${fieldName}:`, error);
    }
  };

  const isFieldPlotted = (typeName: string, fieldName: string) => {
    let baseName = typeName;
    let instance: number | undefined;
    const match = typeName.match(/^([^\[]+)\[(\d+)\]$/);
    if (match) {
      baseName = match[1]!;
      instance = parseInt(match[2]!, 10);
    }

    const id = instance !== undefined 
      ? `${baseName}[${instance}].${fieldName}`
      : `${baseName}.${fieldName}`;
    return activePlots.some((p) => p.id === id);
  };

  return (
    <div className="message-tree-container">
      {/* Active Plots Section */}
      {activePlots.length > 0 && (
        <div className="active-plots">
          <div className="active-plots-header">
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Activity size={12} className="text-cyan-500" />
              <span>Active Plots ({activePlots.length})</span>
            </div>
            <button type="button" className="clear-btn" onClick={clearPlots}>
              Clear All
            </button>
          </div>
          <ul className="active-plots-list">
            {activePlots.map((plot) => (
              <li key={plot.id}>
                <span className="active-plot-badge">
                  <span
                    className="active-plot-color"
                    style={{ backgroundColor: plot.color }}
                  />
                  <span>{plot.id}</span>
                  <button
                    type="button"
                    className="active-plot-remove"
                    onClick={() => removePlot(plot.id)}
                    title="Remove plot"
                  >
                    <X size={10} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Search & Filters */}
      <div className="search-container" style={{ marginTop: activePlots.length > 0 ? "12px" : "0" }}>
        <Search className="search-icon" size={14} />
        <input
          className="search-input"
          placeholder="Filter types or fields…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        {filter && (
          <button
            type="button"
            onClick={() => setFilter("")}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              color: "var(--muted)",
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="tree-toolbar">
        <span>Showing {filtered.length} types</span>
        <button
          type="button"
          className="toggle-container"
          onClick={() => setHideSystem(!hideSystem)}
          style={{ background: "transparent", border: 0, color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
        >
          {hideSystem ? <EyeOff size={12} /> : <Eye size={12} />}
          <span>{hideSystem ? "Hide System" : "Show System"}</span>
        </button>
      </div>

      {/* Tree View */}
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
                    {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </span>
                  <span className="type-name">{type.name}</span>
                  <span className="type-count">{type.count.toLocaleString()}</span>
                  {type.loaded && <span className="badge-loaded">loaded</span>}
                </button>
                {isOpen && (
                  <ul className="tree-fields">
                    {type.fields.map((field) => {
                      const active = isFieldPlotted(type.name, field.name);
                      return (
                        <li key={field.name}>
                          <button
                            type="button"
                            className={`field-btn ${active ? "active" : ""}`}
                            onClick={() => void onFieldClick(type.name, field.name)}
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
