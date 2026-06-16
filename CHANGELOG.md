# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-06-16

### Added

- **Viewer Enhancements:**
  - Integrated zoom and pan functionality into the `PlotChart` component with keyboard shortcuts and dynamic cursor styling.
  - Added flight mode visualization using shaded background bands and labels.
  - Created automatic plot preset extraction from XML configurations, including a new `PresetTree` component.
  - Enhanced GPS trajectory handling with dynamic GPS source resolution (resolving message types and instances).
  - Added support for visualizing and formatting text-based data series in the plot charts.
- **Parser WASM Updates:**
  - Added flight mode parsing and mapping logic to translate raw modes into descriptive names.
  - Ensured `MSG` message is automatically loaded when parsing `MODE` messages to compute mode timestamps correctly.
- **CI & Release Workflows:**
  - Integrated testing, formatting, and linting for the `viewer` project into the GitHub Actions CI workflow.
  - Configured GitHub Release workflow to build, package, and attach the prebuilt standalone `viewer` application bundle (`uav-log-viewer.zip`).

[0.3.0]: https://github.com/HatemslaH/rust_dataflash_parser/releases/tag/v0.3.0

## [0.2.1] - 2026-06-16

### Added

- Rustdoc for public API (`LogSession`, `ParseResult`, `ParseError`, types, JSON export)
- Explicit docs.rs link in README and `Cargo.toml`

[0.2.1]: https://github.com/HatemslaH/rust_dataflash_parser/releases/tag/v0.2.1

## [0.2.0] - 2026-06-16

### Added

- `LogSession` API: `open` (mmap), `from_bytes`, `index`, `load_message_type`, `load_messages`, `extract_start_time`
- Two-phase parsing: index headers first, load message payloads on demand
- JSON export via serde (`schema_version: 1`, base64 `files` section)
- `LogMetadata` on `ParseResult` (`start_time`, `file_size`, `message_type_count`)
- `extract_start_time` and GPS leap-second helpers (`src/time.rs`)
- Full CLI on clap: `--format`, `--output`, `--messages`, `--list-types`, `--parallel`, `--no-metadata`
- Parallel message-type parsing via rayon (`parallel` feature, default on)
- Integration and JS parity tests; offline `tests/fixtures/minimal.bin`
- CI workflow (`fmt`, `clippy`, `test`, integration, fuzz smoke)
- Fuzz targets `parse_type` and `df_scan`
- MIT license for Rust code

### Changed

- `populate_units` errors are propagated instead of ignored
- `get` / `get_instance` return `Result<FieldArray>` with `FieldParseError` on decode failures
- `ParseResult` includes `metadata`, `files`, and `fmt_stats`
- CLI: `--json` replaced by `--format json`

### Deprecated

- `DataflashParser::process_data` — use `LogSession` instead

[0.2.0]: https://github.com/HatemslaH/rust_dataflash_parser/releases/tag/v0.2.0
[0.1.0]: https://github.com/HatemslaH/rust_dataflash_parser/releases/tag/v0.1.0

## [0.1.0] - 2026-06-16

### Added

- Rust library and CLI for parsing ArduPilot dataflash `.BIN` logs, ported from [JsDataflashParser](https://github.com/Williangalvani/JsDataflashParser)
- Core parsing: FMT discovery, binary field decoding, instance splitting, MODE text mapping, FILE payload reassembly
- Default message set matching the JavaScript parser (`CMD`, `MSG`, `FILE`, `MODE`, `AHR2`, `ATT`, `GPS`, `POS`, `XKQ1`, `XKQ`, `NKQ1`, `NKQ2`, `XKQ2`, `PARM`, `STAT`, `EV`)
- `download_dataflash_logs.py` — fetch autotest `.BIN` logs from [autotest.ardupilot.org](https://autotest.ardupilot.org/)
- `benchmark_parsers.py` — compare JS vs Rust parse time and memory (`--js-only`, `--rust-only`, `--min-kb`, `--max-kb`)
- `JsDataflashParser` included as a git submodule for benchmarks and reference
- Cross-platform release binaries (Linux, Windows, macOS)
