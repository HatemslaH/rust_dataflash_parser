# rust_dataflash_parser

A fast, idiomatic Rust port of [JsDataflashParser](JsDataflashParser/) for parsing ArduPilot **dataflash** binary logs (`.BIN` files). The parsing logic mirrors the JavaScript implementation: FMT discovery, field decoding, instance splitting, MODE text mapping, and FILE payload reassembly.

This repository also includes tooling to download autotest logs, benchmark JS vs Rust parsers, and compare parse time and memory usage.

## Prerequisites

| Tool | Used for |
|------|----------|
| [Rust](https://rustup.rs/) (2024 edition) | Building and running the parser |
| [Node.js](https://nodejs.org/) | Running `JsDataflashParser` in benchmarks |
| Python 3.10+ | Download and benchmark scripts |
| `psutil` (optional) | Peak RSS memory sampling in benchmarks |

```bash
pip install psutil   # optional, for memory metrics in benchmark_parsers.py
```

## Clone

`JsDataflashParser` is included as a [git submodule](https://github.com/Williangalvani/JsDataflashParser):

```bash
git clone https://github.com/HatemslaH/rust_dataflash_parser.git
cd rust_dataflash_parser
git submodule update --init --recursive
```

When cloning in one step:

```bash
git clone --recurse-submodules https://github.com/HatemslaH/rust_dataflash_parser.git
```

Pre-built binaries for Linux, Windows, and macOS are available on the [Releases](https://github.com/HatemslaH/rust_dataflash_parser/releases) page.

## Quick start

```bash
# Build the release binary
cargo build --release

# Parse a single log
./target/release/rust_dataflash_parser path/to/log.BIN

# Machine-readable output (used by the benchmark script)
./target/release/rust_dataflash_parser path/to/log.BIN --json
```

On Windows the binary is `target\release\rust_dataflash_parser.exe`.

## Library usage

```rust
use rust_dataflash_parser::DataflashParser;

let mut parser = DataflashParser::new();
let data = std::fs::read("log.BIN")?;
let result = parser.process_data(data, None)?; // None = default message list

// Parsed message groups keyed by name (with instance suffix when applicable)
let _messages = &result.messages;

// Metadata: units, multipliers, instance fields
let _types = &result.message_types;

// Aggregate stats
println!("messages: {}", result.stats.message_count);
println!("values: {}", result.stats.value_count);

// After parsing
let _files = parser.files();   // reconstructed FILE log payloads
let _stats = parser.stats();   // per-message-type byte statistics
```

Default parsed message types (same as JS): `CMD`, `MSG`, `FILE`, `MODE`, `AHR2`, `ATT`, `GPS`, `POS`, `XKQ1`, `XKQ`, `NKQ1`, `NKQ2`, `XKQ2`, `PARM`, `STAT`, `EV`.

Pass a custom slice to `process_data(data, Some(&["GPS", "ATT"]))` to parse only selected types.

## Download autotest logs

The script fetches all `.BIN` files linked from [autotest.ardupilot.org](https://autotest.ardupilot.org/) (~2300 files) into `dataflash_logs/`.

```bash
python download_dataflash_logs.py

# Options
python download_dataflash_logs.py --workers 8          # parallel downloads (default: 4)
python download_dataflash_logs.py --out-dir dataflash_logs
python download_dataflash_logs.py --limit 10           # smoke test
```

Existing files are skipped. Failed downloads are retried with exponential backoff.

## Benchmark: JS vs Rust

Compares `JsDataflashParser` (Node) and `rust_dataflash_parser` on the same `.BIN` files.

```bash
cargo build --release
python benchmark_parsers.py                  # first 5 files in dataflash_logs/
python benchmark_parsers.py --limit 100      # more files
python benchmark_parsers.py --min-kb 100     # files >= 100 KB only
python benchmark_parsers.py --min-kb 100 --max-kb 5000
python benchmark_parsers.py --js-only        # JsDataflashParser only
python benchmark_parsers.py --rust-only      # Rust parser only
python benchmark_parsers.py --json-out results.json
```

Example output:

```
Name                                 KB    JS ms   Rs ms     Spd  JS#  Rs#   JS MB  Rs MB
------------------------------------------------------------------------------------------
ArduPlane-AutoLandMode~00000100.BIN  92.0    67.8     2.3   4.9x   13   13     0.0    0.0
...
------------------------------------------------------------------------------------------
TOTAL                                        335.5    15.4  21.8x
```

Columns: file size (KB), parse time per parser (ms), speedup (`Spd`), parsed message-group count (`JS#` / `Rs#`), peak RSS (MB). Install `psutil` for non-zero memory readings.

The JS harness is `benchmark_js.mjs`; it loads `JsDataflashParser/parser.js` directly.

## Project layout

```
rust_dataflash_parser/
├── JsDataflashParser/       # Git submodule — original JavaScript parser
├── src/
│   ├── lib.rs               # Library root
│   ├── main.rs              # CLI binary
│   ├── parser.rs            # Core parser (port of parser.js)
│   ├── format.rs            # Binary field types and decoding
│   ├── types.rs             # Data structures
│   ├── mode.rs              # MAV mode maps and units
│   └── error.rs             # ParseError
├── download_dataflash_logs.py
├── benchmark_parsers.py
├── benchmark_js.mjs
└── dataflash_logs/          # Downloaded .BIN files (gitignored)
```

## Development

```bash
cargo fmt
cargo check
cargo test
cargo build --release
```

## Differences from JsDataflashParser

The Rust port focuses on core parsing. Browser-only or metadata helpers from the JS version are not implemented:

- `extractStartTime`, leap-second helpers
- `trimFile`, Web Worker progress callbacks (`postMessage`)

Parsing semantics for the default message set match the JS parser; the benchmark script checks that message counts agree.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

Follow the license of the upstream ArduPilot / JsDataflashParser components where applicable.
