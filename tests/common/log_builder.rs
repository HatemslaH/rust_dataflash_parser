//! Helpers for building synthetic dataflash `.BIN` fixtures in integration tests.

use rust_dataflash_parser::{HEAD1, HEAD2};

const FMT_MESSAGE_TYPE_ID: u8 = 128;

pub fn write_header(buf: &mut Vec<u8>, type_id: u8) {
    buf.push(HEAD1);
    buf.push(HEAD2);
    buf.push(type_id);
}

fn write_padded_string(buf: &mut Vec<u8>, len: usize, s: &str) {
    let mut bytes = vec![0u8; len];
    let copy_len = s.len().min(len);
    bytes[..copy_len].copy_from_slice(&s.as_bytes()[..copy_len]);
    buf.extend_from_slice(&bytes);
}

/// Emit an FMT (type 128) message that registers a new message type.
///
/// The bootstrap FMT row uses format `BBnNZ`: `Format` is 16 bytes (`N`), `Columns` is 64 (`Z`).
pub fn write_fmt_definition(
    buf: &mut Vec<u8>,
    type_id: u8,
    length: u8,
    name: &str,
    format: &str,
    columns: &str,
) {
    write_header(buf, FMT_MESSAGE_TYPE_ID);
    buf.push(type_id);
    buf.push(length);
    write_padded_string(buf, 4, name);
    write_padded_string(buf, 16, format);
    write_padded_string(buf, 64, columns);
}

pub fn write_u64_le(buf: &mut Vec<u8>, value: u64) {
    buf.extend_from_slice(&value.to_le_bytes());
}

pub fn write_f32_le(buf: &mut Vec<u8>, value: f32) {
    buf.extend_from_slice(&value.to_le_bytes());
}

/// TST message: format `QB` — `TimeUS` (u64) + `Val` (f32).
pub fn write_tst_message(buf: &mut Vec<u8>, type_id: u8, time_us: u64, val: f32) {
    write_header(buf, type_id);
    write_u64_le(buf, time_us);
    write_f32_le(buf, val);
}

/// Minimal valid log: one FMT row for `TST` and three sample messages.
pub fn minimal_valid_log() -> Vec<u8> {
    let mut buf = Vec::new();
    write_fmt_definition(&mut buf, 130, 12, "TST", "QB", "TimeUS,Val");
    write_tst_message(&mut buf, 130, 1_000_000, 1.0);
    write_tst_message(&mut buf, 130, 2_000_000, 2.0);
    write_tst_message(&mut buf, 130, 3_000_000, 3.0);
    buf
}

/// Log whose FMT row has more column names than format characters (invalid metadata).
pub fn log_with_fmt_column_mismatch() -> Vec<u8> {
    let mut buf = Vec::new();
    write_fmt_definition(&mut buf, 130, 12, "TST", "QB", "TimeUS,Val,Extra");
    write_tst_message(&mut buf, 130, 1_000_000, 1.0);
    buf
}

/// Log whose FMT format string contains an unknown type character.
pub fn log_with_unknown_format_char() -> Vec<u8> {
    let mut buf = Vec::new();
    write_fmt_definition(&mut buf, 130, 12, "TST", "QX", "TimeUS,Val");
    write_tst_message(&mut buf, 130, 1_000_000, 1.0);
    buf
}
