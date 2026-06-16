//! Fast Rust parser for ArduPilot dataflash (`.BIN`) logs.
//!
//! This crate ports the core parsing logic from
//! [JsDataflashParser](https://github.com/Williangalvani/JsDataflashParser):
//! FMT discovery, binary field decoding, instance splitting, MODE text mapping,
//! and FILE payload reassembly.
//!
//! # API documentation
//!
//! Full rustdoc: <https://docs.rs/rust_dataflash_parser/latest/rust_dataflash_parser/>
//!
//! # Two-phase parsing
//!
//! For large logs, use [`LogSession`] to index the file first (scan headers only),
//! then load message types on demand:
//!
//! ```no_run
//! use rust_dataflash_parser::{LogSession, Parallelism, DEFAULT_MESSAGES};
//!
//! let mut session = LogSession::open("log.BIN")?;
//! session.index()?;
//! session.load_messages(
//!     &DEFAULT_MESSAGES.iter().map(|s| s.to_string()).collect::<Vec<_>>(),
//!     Parallelism::Sequential,
//! )?;
//! session.extract_start_time()?;
//! let result = session.into_result();
//! # Ok::<(), rust_dataflash_parser::ParseError>(())
//! ```
//!
//! # JSON export
//!
//! [`ParseResult::to_json_pretty`] produces a versioned JSON document suitable for UI
//! consumers (`schema_version: 1`).
//!
//! # Legacy API
//!
//! [`DataflashParser::process_data`] performs a full parse in one call (deprecated).

mod error;
mod export;
pub mod format;
mod mode;
mod parser;
mod session;
mod time;
mod types;

pub use error::{ParseError, Result};
pub use export::json::LogExport;
pub use parser::DataflashParser;
pub use session::{LogSession, Parallelism};
pub use types::{
    ComplexField, DEFAULT_MESSAGES, FieldArray, FmtEntry, HEAD1, HEAD2, LogMetadata, MessageStats,
    MessageTypeInfo, ParseResult, ParseStats,
};
