# Dataflash Viewer

Web UI for exploring ArduPilot **dataflash** binary logs (`.BIN`). This package is the **visual front-end** of the [rust_dataflash_parser](../README.md) project — the Rust crate handles parsing; this viewer focuses on charts, maps, and log inspection.

> **Current status:** the UI runs on **mock data** for demonstration. Wiring to the Rust parser (WASM or native) is planned separately.

## Features

- **Sidebar layout** inspired by [UAV Log Viewer](https://github.com/ardupilot/uavlogviewer): Home / Plot / More tabs
- **Time-series charts** with [uPlot](https://github.com/leeoniya/uPlot) — multi-series, dual Y-axis, drag-to-zoom, CSV export
- **3D map** with [MapLibre GL JS](https://maplibre.org/) + [Three.js](https://threejs.org/) via [`@dvt3d/maplibre-three-plugin`](https://github.com/dvt3d/maplibre-three-plugin) — GPS trajectory and vehicle marker
- **Message browser** — filterable tree of log message types and fields; click a field to plot it
- **Time sync** — hover on the chart to move the map cursor and attitude widget
- **Mock parser** — synthetic ATT / GPS / BARO / MODE / RCIN data; no `.BIN` file required for demo

## Stack

| Layer | Library |
|-------|---------|
| UI | React 19, TypeScript, Vite |
| Charts | uPlot |
| Map | maplibre-gl, three, @dvt3d/maplibre-three-plugin |
| Data fetching | @tanstack/react-query |
| Components | @mantine/core (provider), @tabler/icons-react |

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- pnpm (recommended) or npm

## Quick start

```bash
cd viewer
pnpm install
pnpm dev
```

Open http://localhost:5173, then click **Load demo log (mock data)** or drop any `.BIN` file (the mock backend simulates parsing).

```bash
pnpm build    # production build
pnpm preview  # preview production build
```

## Project layout

```
viewer/
├── src/
│   ├── components/     # App shell, charts, map, sidebar panels
│   ├── hooks/          # React Query field-series hooks
│   ├── lib/            # Decimation, CSV export, query client
│   ├── platform/       # ParserBackend interface + mock implementation
│   └── stores/         # Session, plot, and time state
├── index.html
├── package.json
└── vite.config.ts
```

## Relationship to rust_dataflash_parser

| Component | Location | Role |
|-----------|----------|------|
| Parser library & CLI | [`../`](../README.md) | Rust port of JsDataflashParser — `LogSession`, JSON export, benchmarks |
| Viewer (this package) | `viewer/` | Browser UI for log exploration |

The mock `ParserBackend` in `src/platform/mock.ts` mirrors the interface expected from a future Rust/WASM integration: `openFile`, `listMessageTypes`, `getFieldSeries`, etc.

## License

Same as the parent repository — Rust code is [MIT](../LICENSE). The upstream [JsDataflashParser](../JsDataflashParser/) submodule remains GPL-3.0.
