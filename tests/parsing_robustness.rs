//! Parsing robustness tests: document current behavior, then guard improvements.

mod common;

use common::log_builder::{
    log_with_fmt_column_mismatch, log_with_unknown_format_char, minimal_valid_log,
};
use rust_dataflash_parser::{FieldArray, LogSession, Parallelism};

#[test]
fn sequential_and_parallel_load_match_on_synthetic_log() {
    let data = minimal_valid_log();

    let mut sequential = LogSession::from_bytes(data.clone());
    sequential.index().expect("index");
    sequential
        .load_message_type("TST")
        .expect("sequential load");

    let mut parallel = LogSession::from_bytes(data);
    parallel.index().expect("index");
    parallel
        .load_messages(&["TST".to_string()], Parallelism::Parallel)
        .expect("parallel load");

    let seq = sequential.snapshot();
    let par = parallel.snapshot();

    let seq_time = seq.messages["TST"]["time_boot_ms"].clone();
    let par_time = par.messages["TST"]["time_boot_ms"].clone();
    let seq_val = seq.messages["TST"]["Val"].clone();
    let par_val = par.messages["TST"]["Val"].clone();

    assert_eq!(field_array_f64(&seq_time), field_array_f64(&par_time));
    assert_eq!(field_array_f64(&seq_val), field_array_f64(&par_val));
}

#[test]
fn timeus_is_exposed_as_time_boot_ms_in_milliseconds() {
    let mut session = LogSession::from_bytes(minimal_valid_log());
    session.index().expect("index");
    session.load_message_type("TST").expect("load");

    let result = session.snapshot();
    let time = field_array_f64(&result.messages["TST"]["time_boot_ms"]);
    assert_eq!(time, vec![1000.0, 2000.0, 3000.0]);
}

#[test]
fn on_demand_timeus_field_returns_raw_microseconds() {
    let mut session = LogSession::from_bytes(minimal_valid_log());
    session.index().expect("index");

    let time = session.get("TST", "TimeUS").expect("TimeUS on demand");
    assert_eq!(field_array_f64(&time), vec![1_000_000.0, 2_000_000.0, 3_000_000.0]);
}

#[test]
#[should_panic]
fn fmt_column_format_mismatch_panics_on_load() {
    let mut session = LogSession::from_bytes(log_with_fmt_column_mismatch());
    session.index().expect("index");
    let _ = session.load_message_type("TST");
}

#[test]
fn unknown_format_char_indexes_but_fails_on_load() {
    let mut session = LogSession::from_bytes(log_with_unknown_format_char());
    session.index().expect("index currently succeeds");
    let err = session.load_message_type("TST").unwrap_err();
    let msg = err.to_string();
    assert!(
        msg.contains("invalid field type") || msg.contains("invalid format"),
        "unexpected error: {msg}"
    );
}

fn field_array_f64(array: &FieldArray) -> Vec<f64> {
    match array {
        FieldArray::Numeric(v) => v.clone(),
        other => panic!("expected numeric field, got {other:?}"),
    }
}
