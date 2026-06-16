# Dataflash Viewer

Web UI for exploring ArduPilot **dataflash** binary logs (`.BIN`). This package is the **visual front-end** of the [rust_dataflash_parser](../README.md) project — parsing runs in **WebAssembly** via the same `LogSession` API as the Rust crate.

## Features

- **Sidebar layout** with Plot / More tabs ([Mantine](https://mantine.dev/) AppShell)
- **Time-series charts** with [uPlot](https://github.com/leeoniya/uPlot) — multi-series, dual Y-axis, drag-to-zoom, CSV export
- **3D map** with [MapLibre GL JS](https://maplibre.org/) + [Three.js](https://threejs.org/) via [`@dvt3d/maplibre-three-plugin`](https://github.com/dvt3d/maplibre-three-plugin) — GPS trajectory and vehicle marker
- **Message browser** — filterable tree of log message types and fields; click a field to plot it
- **Time sync** — hover on the chart to move the map cursor and attitude widget
- **Rust parser (WASM)** — real `.BIN` indexing and lazy field loading

## Stack

| Layer | Library |
|-------|---------|
| UI | React 19, TypeScript, Vite |
| Parser | `rust_dataflash_parser` → `parser-wasm` (wasm-pack) |
| Charts | uPlot |
| Map | maplibre-gl, three, @dvt3d/maplibre-three-plugin |
| Data fetching | @tanstack/react-query |
| Components | @mantine/core, @tabler/icons-react |

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://rustup.rs/) stable + `wasm32-unknown-unknown` target
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/) (`cargo install wasm-pack`)
- pnpm (recommended) or npm

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
```

## Quick start

```bash
cd viewer
pnpm install
pnpm run build:wasm   # first time / after Rust parser changes
pnpm dev
```

Open http://localhost:5173, drop a `.BIN` file, or click **Load sample log** (uses `public/demo-flight.bin` from the test fixture).

```bash
pnpm build    # builds WASM + production bundle
pnpm preview  # preview production build
```

## Project layout

```
viewer/
├── parser-wasm/        # wasm-bindgen wrapper over rust_dataflash_parser
├── src/
│   ├── components/     # App shell, charts, map, sidebar panels
│   ├── hooks/          # React Query field-series hooks
│   ├── lib/            # Decimation, CSV export, query client
│   ├── platform/       # ParserBackend: WASM (default) + mock for tests
│   └── stores/         # Session, plot, and time state
├── public/
│   └── demo-flight.bin # minimal test log
├── index.html
├── package.json
└── vite.config.ts
```

## Relationship to rust_dataflash_parser

| Component | Location | Role |
|-----------|----------|------|
| Parser library & CLI | [`../`](../README.md) | Rust port of JsDataflashParser — `LogSession`, JSON export, benchmarks |
| WASM bindings | `parser-wasm/` | Browser bridge: `openFile`, `listMessageTypes`, `getFieldSeries` |
| Viewer (this package) | `viewer/` | Browser UI for log exploration |

The `ParserBackend` interface in `src/platform/types.ts` is implemented by `createWasmParserBackend()` (default) and `createMockParserBackend()` (UI demos / tests).

## License

Same as the parent repository — Rust code is [MIT](../LICENSE). The upstream [JsDataflashParser](../JsDataflashParser/) submodule remains GPL-3.0.
