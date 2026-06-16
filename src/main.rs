use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::time::Instant;

use clap::Parser;
use rust_dataflash_parser::{DEFAULT_MESSAGES, LogSession, Parallelism, ParseResult};

#[derive(Parser)]
#[command(name = "rust_dataflash_parser")]
#[command(about = "Parse ArduPilot dataflash (.BIN) logs")]
struct Cli {
    /// Path to a dataflash .BIN log file
    file: PathBuf,

    /// Output format: summary or json
    #[arg(long, default_value = "summary")]
    format: OutputFormat,

    /// Output file path (default: stdout)
    #[arg(long, default_value = "-")]
    output: String,

    /// Comma-separated message types to parse (default: built-in list)
    #[arg(long, value_delimiter = ',')]
    messages: Option<Vec<String>>,

    /// Only index the log and print available message types
    #[arg(long)]
    list_types: bool,

    /// Parse message types in parallel (rayon)
    #[arg(long)]
    parallel: bool,

    /// Skip GPS start time extraction
    #[arg(long)]
    no_metadata: bool,
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum OutputFormat {
    Summary,
    Json,
}

impl std::str::FromStr for OutputFormat {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "summary" => Ok(OutputFormat::Summary),
            "json" => Ok(OutputFormat::Json),
            _ => Err(format!("unknown format '{s}', expected json or summary")),
        }
    }
}

fn main() {
    if let Err(err) = run() {
        eprintln!("error: {err}");
        std::process::exit(1);
    }
}

fn run() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();
    let start = Instant::now();

    let mut session = LogSession::open(&cli.file)?;
    session.index()?;

    if cli.list_types {
        let types = session.available_message_types();
        for t in types {
            println!("{t}");
        }
        return Ok(());
    }

    let message_list: Vec<String> = cli
        .messages
        .unwrap_or_else(|| DEFAULT_MESSAGES.iter().map(|s| s.to_string()).collect());

    let parallelism = if cli.parallel {
        Parallelism::Parallel
    } else {
        Parallelism::Sequential
    };
    session.load_messages(&message_list, parallelism)?;

    if !cli.no_metadata {
        session.extract_start_time()?;
    }

    let result = session.into_result();
    let elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;

    match cli.format {
        OutputFormat::Summary => print_summary(&cli.file, &result, elapsed_ms)?,
        OutputFormat::Json => print_json(&result, &cli.output)?,
    }

    Ok(())
}

fn print_summary(path: &Path, result: &ParseResult, elapsed_ms: f64) -> io::Result<()> {
    println!("file: {}", path.display());
    println!("file_size: {} bytes", result.metadata.file_size);
    if let Some(start) = result.metadata.start_time {
        println!("start_time: {}", start.to_rfc3339());
    }
    println!("parse_time: {elapsed_ms:.3} ms");
    println!("message_types: {}", result.metadata.message_type_count);
    println!("messages_parsed: {}", result.stats.message_count);
    println!("fields: {}", result.stats.field_count);
    println!("values: {}", result.stats.value_count);
    println!("estimated_data_bytes: {}", result.stats.estimated_bytes);
    Ok(())
}

fn print_json(result: &ParseResult, output_path: &str) -> Result<(), Box<dyn std::error::Error>> {
    let json = result.to_json_pretty()?;
    if output_path == "-" {
        println!("{json}");
    } else {
        fs::write(output_path, json)?;
    }
    Ok(())
}
