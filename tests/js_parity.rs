use std::path::PathBuf;
use std::process::Command;

use rust_dataflash_parser::{DEFAULT_MESSAGES, LogSession, Parallelism};

fn root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}

fn run_js_benchmark(path: &PathBuf) -> Option<serde_json::Value> {
    let script = root().join("benchmark_js.mjs");
    let output = Command::new("node").arg(&script).arg(path).output().ok()?;
    if !output.status.success() {
        return None;
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    serde_json::from_str(stdout.trim()).ok()
}

fn rust_stats(path: &PathBuf) -> rust_dataflash_parser::ParseResult {
    let data = std::fs::read(path).expect("read log");
    let mut session = LogSession::from_bytes(data);
    session.index().expect("index");
    let names: Vec<String> = DEFAULT_MESSAGES.iter().map(|s| s.to_string()).collect();
    session
        .load_messages(&names, Parallelism::Sequential)
        .expect("load");
    session.into_result()
}

#[test]
fn js_parity_on_minimal_fixture() {
    let path = root().join("tests/fixtures/minimal.bin");
    let js = run_js_benchmark(&path);
    if js.is_none() {
        eprintln!("skip: node or benchmark_js.mjs unavailable");
        return;
    }
    let js = js.unwrap();

    let rust = rust_stats(&path);

    assert_eq!(
        js.get("messages").and_then(|v| v.as_u64()),
        Some(rust.stats.message_count as u64)
    );
    assert_eq!(
        js.get("values").and_then(|v| v.as_u64()),
        Some(rust.stats.value_count as u64)
    );
}

#[test]
fn js_parity_on_downloaded_logs() {
    let log_dir = root().join("dataflash_logs");
    if !log_dir.is_dir() {
        eprintln!("skip: dataflash_logs not present");
        return;
    }

    let mut files: Vec<PathBuf> = std::fs::read_dir(&log_dir)
        .expect("read dir")
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| {
            p.extension()
                .is_some_and(|ext| ext.eq_ignore_ascii_case("bin"))
        })
        .collect();
    files.sort();
    files.truncate(5);

    if files.is_empty() {
        eprintln!("skip: no .BIN files in dataflash_logs");
        return;
    }

    for path in files {
        let js = run_js_benchmark(&path);
        if js.is_none() {
            eprintln!("skip: node benchmark failed for {}", path.display());
            continue;
        }
        let js = js.unwrap();
        let rust = rust_stats(&path);

        assert_eq!(
            js.get("messages").and_then(|v| v.as_u64()),
            Some(rust.stats.message_count as u64),
            "message count mismatch for {}",
            path.display()
        );
        assert_eq!(
            js.get("values").and_then(|v| v.as_u64()),
            Some(rust.stats.value_count as u64),
            "value count mismatch for {}",
            path.display()
        );
        assert_eq!(
            js.get("fields").and_then(|v| v.as_u64()),
            Some(rust.stats.field_count as u64),
            "field count mismatch for {}",
            path.display()
        );
    }
}
