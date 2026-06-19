# AGENTS.md

## Cursor Cloud specific instructions

This repo has two deliverables sharing one Rust parsing engine (no backend, no database, no secrets):

- **Rust parser library + CLI** (`/`, crate `rust_dataflash_parser`) — parses ArduPilot dataflash `.BIN` logs.
- **Dataflash Viewer** (`viewer/`) — React 19 + Vite SPA that parses `.BIN` files in-browser via WebAssembly (`viewer/parser-wasm/`, built with `wasm-pack`).

### Toolchain (pre-installed in the environment snapshot)

- Rust **stable ≥ 1.85** is required because the crate uses `edition = "2024"`. The base image's older Rust (1.83) fails with `feature edition2024 is required`. The snapshot has `rustup default stable` (1.96+) plus the `wasm32-unknown-unknown` target, `rustfmt`, `clippy`, and `wasm-pack`. These are NOT in the update script (system tooling); if a fresh VM lacks them, run: `rustup default stable`, `rustup component add rustfmt clippy`, `rustup target add wasm32-unknown-unknown`, `cargo install wasm-pack`.
- Node 22 + pnpm 10 are pre-installed. The viewer uses pnpm (lockfile `viewer/pnpm-lock.yaml`).

### Build / lint / test / run

Standard commands are documented in `README.md` and `viewer/README.md`; the authoritative CI steps are in `.github/workflows/ci.yml`. Quick reference:

| Component | Lint | Test | Build | Run (dev) |
|-----------|------|------|-------|-----------|
| Rust parser/CLI (`/`) | `cargo fmt --check` + `cargo clippy --all-targets -- -D warnings` | `cargo test` | `cargo build --release` | `./target/release/rust_dataflash_parser <log.BIN>` |
| Viewer (`viewer/`) | `pnpm run lint` | (no unit tests) | `pnpm run build` | `pnpm dev` (Vite, http://localhost:5173) |

### Non-obvious caveats

- **Build the WASM before running the viewer.** The viewer imports `viewer/parser-wasm/pkg` which is gitignored and not present on a fresh checkout. Run `pnpm run build:wasm` (or `pnpm run build`, which includes it) in `viewer/` first, otherwise `pnpm dev` will fail to resolve the parser import. Re-run `build:wasm` after any change to the Rust parser or `parser-wasm` crate.
- **`pnpm run lint` emits one harmless warning** ("Unused eslint-disable directive") from the generated `parser-wasm/pkg/*.d.ts` file. This is expected; lint still exits 0.
- **The `JsDataflashParser/` git submodule must be checked out** for the `cargo test --test js_parity` parity test (the update script does this). Without it the submodule dir is empty.
- **Sample data**: `viewer/public/demo-flight.bin` and `tests/fixtures/minimal.bin` are tiny (125 bytes, only FMT/TST — 0 parsed messages). For a meaningful demo, fetch a real log with `python download_dataflash_logs.py --limit 1` (writes to gitignored `dataflash_logs/`), then load it via the viewer's "click to browse" upload or pass it to the CLI.
- The viewer dev server runs at port **5173** (`base: /` in dev; `vite.config.ts` only applies the `/rust_dataflash_parser/` base for production builds).
