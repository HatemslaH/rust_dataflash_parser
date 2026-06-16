#!/usr/bin/env python3
"""Download all ArduPilot autotest dataflash .BIN logs."""

from __future__ import annotations

import argparse
import re
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

BASE_URL = "https://autotest.ardupilot.org/"
BIN_HREF_RE = re.compile(r'href=["\']([^"\']+\.BIN)["\']', re.IGNORECASE)
DEFAULT_OUT_DIR = Path(__file__).resolve().parent / "dataflash_logs"


def discover_bin_urls(index_html: str) -> list[str]:
    names = BIN_HREF_RE.findall(index_html)
    # Preserve order while deduplicating.
    seen: set[str] = set()
    unique: list[str] = []
    for name in names:
        if name not in seen:
            seen.add(name)
            unique.append(name)
    return unique


def fetch_index(url: str = BASE_URL, retries: int = 5) -> str:
    last_err: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(url, timeout=60) as resp:
                return resp.read().decode("utf-8", "replace")
        except (urllib.error.URLError, TimeoutError) as exc:
            last_err = exc
            sleep_s = min(2**attempt, 30)
            print(f"index fetch failed (attempt {attempt}/{retries}): {exc}; retrying in {sleep_s}s")
            time.sleep(sleep_s)
    raise RuntimeError(f"failed to fetch index from {url}") from last_err


def download_file(name: str, out_dir: Path, retries: int = 5) -> tuple[str, str]:
    """Return (name, status) where status is 'ok', 'skipped', or error text."""
    dest = out_dir / name
    if dest.exists() and dest.stat().st_size > 0:
        return name, "skipped"

    url = BASE_URL + name
    last_err: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(url, timeout=120) as resp:
                data = resp.read()
            dest.write_bytes(data)
            return name, "ok"
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            last_err = exc
            if dest.exists():
                dest.unlink(missing_ok=True)
            time.sleep(min(2**attempt, 30))
    return name, f"error: {last_err}"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=DEFAULT_OUT_DIR,
        help=f"output directory (default: {DEFAULT_OUT_DIR})",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=8,
        help="parallel download workers (default: 8)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="download only first N files (0 = all)",
    )
    parser.add_argument(
        "--retries",
        type=int,
        default=5,
        help="retry attempts per file (default: 5)",
    )
    args = parser.parse_args()

    args.out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Fetching index from {BASE_URL} ...")
    html = fetch_index()
    names = discover_bin_urls(html)
    if args.limit > 0:
        names = names[: args.limit]
    total = len(names)
    print(f"Found {total} .BIN files")

    ok = skipped = failed = 0
    started = time.time()

    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futures = {
            pool.submit(download_file, name, args.out_dir, args.retries): name for name in names
        }
        for i, future in enumerate(as_completed(futures), start=1):
            name, status = future.result()
            if status == "ok":
                ok += 1
            elif status == "skipped":
                skipped += 1
            else:
                failed += 1
                print(status + f" ({name})")

            if i % 25 == 0 or i == total:
                elapsed = time.time() - started
                print(
                    f"progress: {i}/{total} | ok={ok} skipped={skipped} failed={failed} | {elapsed:.1f}s"
                )

    elapsed = time.time() - started
    print(
        f"done: downloaded={ok} skipped={skipped} failed={failed} total={total} elapsed={elapsed:.1f}s"
    )
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
