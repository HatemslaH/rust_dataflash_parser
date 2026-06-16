#![no_main]

use libfuzzer_sys::fuzz_target;
use rust_dataflash_parser::format::parse_type_at;

fuzz_target!(|data: &[u8]| {
    if data.is_empty() {
        return;
    }
    let type_char = data[0] as char;
    let mut offset = 1usize;
    let _ = parse_type_at(data, &mut offset, type_char);
});
