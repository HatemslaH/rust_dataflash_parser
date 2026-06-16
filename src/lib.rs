//! Fast Rust parser for ArduPilot dataflash (`.BIN`) logs.
//!
//! This crate ports the core parsing logic from
//! [JsDataflashParser](https://github.com/Williangalvani/JsDataflashParser):
//! FMT discovery, binary field decoding, instance splitting, MODE text mapping,
//! and FILE payload reassembly.
//!
//! ## Two-phase parsing
//!
//! For large logs, use [`LogSession`] to index the file first (scan headers only),
//! then load message types on demand:
//!
//! ```no_run
//! use rust_dataflash_parser::{LogSession, Parallelism};
//!
//! let mut session = LogSession::open("log.BIN")?;
//! session.index()?;
//! session.load_message_type("GPS")?;
//! let result = session.snapshot();
//! # Ok::<(), rust_dataflash_parser::ParseError>(())
//! ```
//!
//! ## Legacy API
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
    ComplexField, DEFAULT_MESSAGES, FieldArray, FmtEntry, LogMetadata, MessageStats,
    MessageTypeInfo, ParseResult, ParseStats,
};
