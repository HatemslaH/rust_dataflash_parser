import { useEffect, useState } from "react";
import { getParserBackend } from "../platform";
import type { MessageTypeEntry } from "../platform/types";
import { useSessionStore } from "../stores/session";

export function MessageTree() {
  const summary = useSessionStore((s) => s.summary);
  const [types, setTypes] = useState<MessageTypeEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const backend = getParserBackend();

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
    if (!needle) {
      return true;
    }
    if (type.name.toLowerCase().includes(needle)) {
      return true;
    }
    return type.fields.some((f) => f.name.toLowerCase().includes(needle));
  });

  const onFieldClick = async (typeName: string, fieldName: string) => {
    await backend.loadMessageTypes([typeName]);
    const series = await backend.getFieldSeries({ messageType: typeName, field: fieldName });
    console.info(`[plot] ${typeName}.${fieldName}`, series.values.length, "samples");
  };

  return (
    <div className="message-tree">
      <input
        className="search-input"
        placeholder="Filter types or fields…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
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
                <span className="chevron">{isOpen ? "▾" : "▸"}</span>
                <span className="type-name">{type.name}</span>
                <span className="type-count">{type.count.toLocaleString()}</span>
                {type.loaded && <span className="badge-loaded">loaded</span>}
              </button>
              {isOpen && (
                <ul className="tree-fields">
                  {type.fields.map((field) => (
                    <li key={field.name}>
                      <button
                        type="button"
                        className="field-btn"
                        onClick={() => void onFieldClick(type.name, field.name)}
                      >
                        <span>{field.name}</span>
                        {field.units && <span className="field-units">{field.units}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
