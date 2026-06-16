#!/usr/bin/env python3
"""Benchmark JsDataflashParser vs rust_dataflash_parser on dataflash logs."""

from __future__ import annotations

import argparse
import json
import os
import statistics
import subprocess
import sys
import time
from pathlib import Path

try:
    import psutil
except ImportError:  # pragma: no cover - optional dependency
    psutil = None

ROOT = Path(__file__).resolve().parent
DEFAULT_LOG_DIR = ROOT / "dataflash_logs"
RUST_BIN = ROOT / "target" / "release" / ("rust_dataflash_parser.exe" if os.name == "nt" else "rust_dataflash_parser")
JS_SCRIPT = ROOT / "benchmark_js.mjs"


def run_cmd(cmd: list[str], cwd: Path | None = None) -> tuple[float, str, int]:
    start = time.perf_counter()
    proc = subprocess.run(
        cmd,
        cwd=cwd or ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    elapsed = time.perf_counter() - start
    return elapsed, proc.stdout.strip(), proc.returncode


def measure_rss_during(cmd: list[str]) -> tuple[float, dict | None, int, str]:
    """Run command and sample peak RSS of child process when psutil is available."""
    if psutil is None:
        elapsed, stdout, code = run_cmd(cmd)
        return elapsed, None, code, stdout

    start = time.perf_counter()
    proc = subprocess.Popen(cmd, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    peak_rss = 0
    try:
        p = psutil.Process(proc.pid)
        while proc.poll() is None:
            try:
                peak_rss = max(peak_rss, p.memory_info().rss)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
            time.sleep(0.01)
        stdout, stderr = proc.communicate()
        elapsed = time.perf_counter() - start
        try:
            peak_rss = max(peak_rss, psutil.Process(proc.pid).memory_info().rss)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
        return elapsed, {"peak_rss_bytes": peak_rss}, proc.returncode, stdout.strip()
    finally:
        if proc.poll() is None:
            proc.kill()


def parse_json_line(stdout: str) -> dict:
    text = stdout.strip()
    if text.startswith("{"):
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
    for line in reversed(text.splitlines()):
        line = line.strip()
        if line.startswith("{"):
            try:
                return json.loads(line)
            except json.JSONDecodeError:
                continue
    return {}


def normalize_rust_stats(data: dict) -> dict:
    """Map v0.2 LogExport JSON to legacy benchmark fields."""
    stats = data.get("stats")
    if not stats:
        return data
    return {
        "file_size": data.get("metadata", {}).get("file_size"),
        "messages": stats.get("message_count"),
        "fields": stats.get("field_count"),
        "values": stats.get("value_count"),
        "estimated_bytes": stats.get("estimated_bytes"),
    }


def benchmark_file(path: Path, rust_bin: Path, *, run_js: bool, run_rust: bool) -> dict:
    js_wall, js_mem, js_code, js_out = 0.0, None, 0, ""
    rust_wall, rust_mem, rust_code, rust_out = 0.0, None, 0, ""

    if run_js:
        js_wall, js_mem, js_code, js_out = measure_rss_during(["node", str(JS_SCRIPT), str(path)])
    if run_rust:
        rust_wall, rust_mem, rust_code, rust_out = measure_rss_during(
            [str(rust_bin), str(path), "--format", "json"]
        )

    js = parse_json_line(js_out) if run_js and js_code == 0 else ({"error": js_out} if run_js else {})
    rust_raw = parse_json_line(rust_out) if run_rust and rust_code == 0 else ({"error": rust_out} if run_rust else {})
    rust = normalize_rust_stats(rust_raw) if run_rust and rust_code == 0 else rust_raw

    speedup = None
    if run_js and run_rust and js_code == 0 and rust_code == 0 and rust_wall > 0:
        speedup = js_wall / rust_wall

    return {
        "file": path.name,
        "file_size": path.stat().st_size,
        "js": {
            "wall_s": js_wall,
            "parse_ms": js.get("parse_ms"),
            "messages": js.get("messages"),
            "values": js.get("values"),
            "estimated_bytes": js.get("estimated_bytes"),
            "peak_rss_bytes": (js_mem or {}).get("peak_rss_bytes") or js.get("rss_bytes"),
            "error": js.get("error"),
        },
        "rust": {
            "wall_s": rust_wall,
            "parse_ms": rust.get("parse_ms"),
            "messages": rust.get("messages"),
            "values": rust.get("values"),
            "estimated_bytes": rust.get("estimated_bytes"),
            "peak_rss_bytes": (rust_mem or {}).get("peak_rss_bytes"),
            "error": rust.get("error"),
        },
        "speedup_wall": speedup,
    }


def short_name(name: str, width: int = 32) -> str:
    """Truncate long filenames, keeping the test name prefix and run number."""
    if len(name) <= width:
        return name
    dot = name.rfind(".")
    ext = name[dot:] if dot >= 0 else ""
    base = name[:dot] if dot >= 0 else name
    dash = base.rfind("-")
    if dash >= 0:
        num_part = base[dash + 1 :]
        prefix = base[:dash]
        tail = f"-{num_part}{ext}"
        head_budget = width - len(tail) - 1
        if head_budget >= 6:
            return f"{prefix[:head_budget]}~{num_part}{ext}"
    return name[: width - 3] + "..." + ext


def _fmt_num(value: float | int | None, width: int, decimals: int = 1) -> str:
    if value is None:
        return f"{'—':>{width}}"
    if isinstance(value, float):
        return f"{value:>{width}.{decimals}f}"
    return f"{value:>{width}}"


def print_table(rows: list[dict], *, run_js: bool, run_rust: bool) -> None:
    name_w, num_w, spd_w, cnt_w, mem_w = 32, 8, 7, 4, 7

    parts = (
        [f"{'Name':<{name_w}}", f"{'KB':>{num_w}}"]
        + ([f"{'JS ms':>{num_w}}"] if run_js else [])
        + ([f"{'Rs ms':>{num_w}}"] if run_rust else [])
        + ([f"{'Spd':>{spd_w}}"] if run_js and run_rust else [])
        + ([f"{'JS#':>{cnt_w}}", f"{'JS MB':>{mem_w}}"] if run_js else [])
        + ([f"{'Rs#':>{cnt_w}}", f"{'Rs MB':>{mem_w}}"] if run_rust else [])
    )

    sep = "-" * (sum(len(p) for p in parts) + len(parts) - 1)
    print(f"\n{' '.join(parts)}\n{sep}")

    total_js = 0.0
    total_rust = 0.0

    for row in rows:
        js = row["js"]
        rust = row["rust"]
        js_ms = (js.get("parse_ms") or (js["wall_s"] * 1000)) if run_js else None
        rust_ms = (rust.get("parse_ms") or (rust["wall_s"] * 1000)) if run_rust else None
        if js_ms is not None:
            total_js += js_ms
        if rust_ms is not None:
            total_rust += rust_ms

        line = [f"{short_name(row['file'], name_w):<{name_w}}", f"{row['file_size'] / 1024:>{num_w}.1f}"]
        if run_js:
            line.append(f"{js_ms:>{num_w}.1f}")
        if run_rust:
            line.append(f"{rust_ms:>{num_w}.1f}")
        if run_js and run_rust:
            speedup = f"{row['speedup_wall']:.1f}x" if row["speedup_wall"] else "n/a"
            line.append(f"{speedup:>{spd_w}}")
        if run_js:
            js_rss = (js.get("peak_rss_bytes") or 0) / (1024 * 1024)
            line.extend([_fmt_num(js.get("messages"), cnt_w, 0), f"{js_rss:>{mem_w}.1f}"])
        if run_rust:
            rust_rss = (rust.get("peak_rss_bytes") or 0) / (1024 * 1024)
            line.extend([_fmt_num(rust.get("messages"), cnt_w, 0), f"{rust_rss:>{mem_w}.1f}"])
        print(" ".join(line))

    print(sep)
    total_line = [f"{'TOTAL':<{name_w}}", f"{'':>{num_w}}"]
    if run_js:
        total_line.append(f"{total_js:>{num_w}.1f}")
    if run_rust:
        total_line.append(f"{total_rust:>{num_w}.1f}")
    if run_js and run_rust:
        overall = total_js / total_rust if total_rust > 0 else 0
        total_line.append(f"{overall:>{spd_w}.1f}x")
    if run_js:
        total_line.extend([f"{'':>{cnt_w}}", f"{'':>{mem_w}}"])
    if run_rust:
        total_line.extend([f"{'':>{cnt_w}}", f"{'':>{mem_w}}"])
    print(" ".join(total_line))


def filter_by_size(files: list[Path], min_kb: float | None, max_kb: float | None) -> list[Path]:
    """Keep files whose size falls within [min_kb, max_kb] (kilobytes), bounds inclusive."""
    if min_kb is None and max_kb is None:
        return files
    min_bytes = int(min_kb * 1024) if min_kb is not None else None
    max_bytes = int(max_kb * 1024) if max_kb is not None else None
    filtered: list[Path] = []
    for path in files:
        size = path.stat().st_size
        if min_bytes is not None and size < min_bytes:
            continue
        if max_bytes is not None and size > max_bytes:
            continue
        filtered.append(path)
    return filtered


def size_filter_label(min_kb: float | None, max_kb: float | None) -> str:
    if min_kb is not None and max_kb is not None:
        return f", size {min_kb:g}–{max_kb:g} KB"
    if min_kb is not None:
        return f", size >= {min_kb:g} KB"
    if max_kb is not None:
        return f", size <= {max_kb:g} KB"
    return ""


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--log-dir", type=Path, default=DEFAULT_LOG_DIR)
    ap.add_argument("--limit", type=int, default=5, help="number of files to benchmark (default: 5)")
    ap.add_argument(
        "--min-kb",
        type=float,
        default=None,
        metavar="KB",
        help="only benchmark files >= this size in kilobytes (e.g. 100)",
    )
    ap.add_argument(
        "--max-kb",
        type=float,
        default=None,
        metavar="KB",
        help="only benchmark files <= this size in kilobytes",
    )
    ap.add_argument("--json-out", type=Path, help="optional path to write JSON results")
    ap.add_argument(
        "--rust-bin",
        type=Path,
        default=RUST_BIN,
        help="path to release rust_dataflash_parser binary",
    )
    parser_group = ap.add_mutually_exclusive_group()
    parser_group.add_argument("--js-only", action="store_true", help="benchmark JsDataflashParser only")
    parser_group.add_argument("--rust-only", action="store_true", help="benchmark Rust parser only")
    args = ap.parse_args()

    run_js = not args.rust_only
    run_rust = not args.js_only

    if run_rust and not args.rust_bin.exists():
        print(f"Rust binary not found at {args.rust_bin}. Run: cargo build --release", file=sys.stderr)
        return 1
    if run_js and not JS_SCRIPT.exists():
        print(f"Missing {JS_SCRIPT}", file=sys.stderr)
        return 1

    files = sorted(args.log_dir.glob("*.BIN"))
    if not files:
        print(f"No .BIN files in {args.log_dir}. Run download_dataflash_logs.py first.", file=sys.stderr)
        return 1

    total_before = len(files)
    files = filter_by_size(files, args.min_kb, args.max_kb)
    if not files:
        print(
            f"No .BIN files match size filter{size_filter_label(args.min_kb, args.max_kb)} "
            f"in {args.log_dir} ({total_before} file(s) scanned).",
            file=sys.stderr,
        )
        return 1

    if args.limit > 0:
        files = files[: args.limit]

    label = []
    if run_js:
        label.append("JS")
    if run_rust:
        label.append("Rust")
    size_note = size_filter_label(args.min_kb, args.max_kb)
    print(f"Benchmarking {' + '.join(label)} on {len(files)} file(s) from {args.log_dir}{size_note}")
    rows = [benchmark_file(path, args.rust_bin, run_js=run_js, run_rust=run_rust) for path in files]
    print_table(rows, run_js=run_js, run_rust=run_rust)

    if args.json_out:
        args.json_out.write_text(json.dumps(rows, indent=2), encoding="utf-8")
        print(f"Wrote {args.json_out}")

    # sanity: message counts should match when both parsers run
    if run_js and run_rust:
        mismatches = [
            r["file"]
            for r in rows
            if r["js"].get("messages") is not None
            and r["rust"].get("messages") is not None
            and r["js"]["messages"] != r["rust"]["messages"]
        ]
        if mismatches:
            print(f"warning: message count mismatch in {len(mismatches)} file(s)", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
