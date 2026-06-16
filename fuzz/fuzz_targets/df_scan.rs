#![no_main]

use libfuzzer_sys::fuzz_target;
use rust_dataflash_parser::types::{HEAD1, HEAD2};

fuzz_target!(|data: &[u8]| {
    let mut offset = 0usize;
    while offset + 3 < data.len() {
        if data[offset] != HEAD1 || data[offset + 1] != HEAD2 {
            offset += 1;
            continue;
        }
        offset += 3;
    }
});
