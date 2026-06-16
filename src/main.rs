use std::env;
use std::fs;
use std::path::PathBuf;
use std::time::Instant;

use rust_dataflash_parser::DataflashParser;

fn main() {
    if let Err(err) = run() {
        eprintln!("error: {err}");
        std::process::exit(1);
    }
}

fn run() -> Result<(), Box<dyn std::error::Error>> {
    let mut args = env::args().skip(1);
    let path = args
        .next()
        .ok_or("usage: rust_dataflash_parser <file.bin> [--json]")?;
    let json_output = args.any(|a| a == "--json");

    let path = PathBuf::from(&path);
    let data = fs::read(&path)?;
    let file_size = data.len();

    let start = Instant::now();
    let mut parser = DataflashParser::new();
    let result = parser.process_data(data, None)?;
    let elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;

    if json_output {
        let file_json = path
            .file_name()
            .map(|n| n.to_string_lossy().replace('\\', "/"))
            .unwrap_or_else(|| path.display().to_string().replace('\\', "/"));
        println!(
            "{{\"file\":\"{file_json}\",\"file_size\":{file_size},\"parse_ms\":{elapsed_ms:.3},\"messages\":{},\"fields\":{},\"values\":{},\"estimated_bytes\":{}}}",
            result.stats.message_count,
            result.stats.field_count,
            result.stats.value_count,
            result.stats.estimated_bytes,
        );
    } else {
        println!("file: {}", path.display());
        println!("file_size: {file_size} bytes");
        println!("parse_time: {elapsed_ms:.3} ms");
        println!("messages_parsed: {}", result.stats.message_count);
        println!("fields: {}", result.stats.field_count);
        println!("values: {}", result.stats.value_count);
        println!("estimated_data_bytes: {}", result.stats.estimated_bytes);
    }

    Ok(())
}
