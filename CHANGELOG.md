# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-16

### Added

- Rust library and CLI for parsing ArduPilot dataflash `.BIN` logs, ported from [JsDataflashParser](https://github.com/Williangalvani/JsDataflashParser)
- Core parsing: FMT discovery, binary field decoding, instance splitting, MODE text mapping, FILE payload reassembly
- Default message set matching the JavaScript parser (`CMD`, `MSG`, `FILE`, `MODE`, `AHR2`, `ATT`, `GPS`, `POS`, `XKQ1`, `XKQ`, `NKQ1`, `NKQ2`, `XKQ2`, `PARM`, `STAT`, `EV`)
- `download_dataflash_logs.py` — fetch autotest `.BIN` logs from [autotest.ardupilot.org](https://autotest.ardupilot.org/)
- `benchmark_parsers.py` — compare JS vs Rust parse time and memory (`--js-only`, `--rust-only`, `--min-kb`, `--max-kb`)
- `JsDataflashParser` included as a git submodule for benchmarks and reference
- Cross-platform release binaries (Linux, Windows, macOS)

[0.1.0]: https://github.com/HatemslaH/rust_dataflash_parser/releases/tag/v0.1.0
