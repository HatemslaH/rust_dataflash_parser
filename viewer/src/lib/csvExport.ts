export interface CsvSeries {
  id: string;
  timeMs: number[];
  values: number[];
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportSeriesToCsv(series: CsvSeries[]): string {
  if (series.length === 0) return "";

  const sameLength = series.every((s) => s.timeMs.length === series[0]!.timeMs.length);
  const sameTime =
    sameLength &&
    series.every(
      (s, i) => i === 0 || s.timeMs.every((t, j) => t === series[0]!.timeMs[j]),
    );

  if (sameTime) {
    const headers = ["time_boot_ms", ...series.map((s) => s.id)];
    const rows: string[] = [headers.map(escapeCsv).join(",")];
    const len = series[0]!.timeMs.length;
    for (let i = 0; i < len; i++) {
      const row = [
        String(series[0]!.timeMs[i]),
        ...series.map((s) => String(s.values[i] ?? "")),
      ];
      rows.push(row.join(","));
    }
    return rows.join("\n");
  }

  const blocks: string[] = [];
  for (const s of series) {
    blocks.push(`# ${s.id}`);
    blocks.push("time_boot_ms,value");
    for (let i = 0; i < s.timeMs.length; i++) {
      blocks.push(`${s.timeMs[i]},${s.values[i]}`);
    }
    blocks.push("");
  }
  return blocks.join("\n");
}

export function downloadCsv(content: string, fileName: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
