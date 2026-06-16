use std::collections::HashMap;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// First byte of the dataflash message header (`0xA3`).
pub const HEAD1: u8 = 163;
/// Second byte of the dataflash message header (`0x95`).
pub const HEAD2: u8 = 149;
/// FMT message type id in the dataflash format table.
pub const FMT_TYPE_ID: u8 = 128;

/// Parsed values for one column across all instances of a message.
#[derive(Debug, Clone)]
pub enum FieldArray {
    /// Numeric columns (integers and floats decoded as `f64`).
    Numeric(Vec<f64>),
    /// String columns (`n`, `N`, `Z` format types).
    Text(Vec<String>),
    /// Fixed-size `i16[32]` arrays (`a` format type).
    Int16x32(Vec<[i16; 32]>),
}

impl FieldArray {
    /// Number of rows in this column.
    pub fn len(&self) -> usize {
        match self {
            FieldArray::Numeric(v) => v.len(),
            FieldArray::Text(v) => v.len(),
            FieldArray::Int16x32(v) => v.len(),
        }
    }

    /// Returns `true` if the column has no rows.
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }

    /// Rough heap-size estimate for benchmarking and stats.
    pub fn estimated_bytes(&self) -> usize {
        match self {
            FieldArray::Numeric(v) => v.len() * std::mem::size_of::<f64>(),
            FieldArray::Text(v) => v
                .iter()
                .map(|s| s.len() + std::mem::size_of::<String>())
                .sum(),
            FieldArray::Int16x32(v) => v.len() * 64,
        }
    }
}

/// Field metadata: human-readable units and multiplier.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplexField {
    /// Column name from the FMT definition.
    pub name: String,
    /// Display units string (prefix + unit), e.g. `m/s`.
    pub units: String,
    /// Numeric multiplier applied to raw values.
    pub multiplier: f64,
}

/// Schema and units for one message type discovered during indexing.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageTypeInfo {
    /// Column names in log order.
    pub expressions: Vec<String>,
    /// Unit strings per column, when FMTU is present.
    pub units: Option<Vec<String>>,
    /// Multipliers per column, when FMTU is present.
    pub multipliers: Option<Vec<f64>>,
    /// Per-field unit metadata keyed by column name.
    pub complex_fields: HashMap<String, ComplexField>,
    /// Instance id → message key mapping (e.g. `GPS[0]`).
    pub instances: Option<HashMap<i64, String>>,
}

/// Internal FMT table entry built during indexing.
#[derive(Debug, Clone)]
pub struct FmtEntry {
    /// Dataflash type id (0–255).
    pub type_id: u8,
    /// Message length from FMT.
    pub length: u8,
    /// Message name, e.g. `GPS`, `ATT`.
    pub name: String,
    /// Binary format string, e.g. `QBIHB`.
    pub format: String,
    /// Column names parsed from FMT.
    pub columns: Vec<String>,
    /// Byte offset of each field within the payload.
    pub format_offset: Vec<usize>,
    /// Payload size in bytes.
    pub size: usize,
    /// File offsets of each message instance.
    pub offset_array: Vec<usize>,
    /// Per-instance offset lists when the message is instanced.
    pub instances_offset_array: Option<HashMap<i64, Vec<usize>>>,
    /// Number of messages of this type in the log.
    pub total_length: usize,
    /// Unit strings from FMTU, when available.
    pub units: Option<Vec<String>>,
    /// Multipliers from FMTU, when available.
    pub multipliers: Option<Vec<f64>>,
}

impl FmtEntry {
    /// Built-in FMT definition used to bootstrap format discovery.
    pub fn default_fmt() -> Self {
        Self {
            type_id: FMT_TYPE_ID,
            length: 89,
            name: "FMT".to_string(),
            format: "BBnNZ".to_string(),
            columns: vec![
                "Type".to_string(),
                "Length".to_string(),
                "Name".to_string(),
                "Format".to_string(),
                "Columns".to_string(),
            ],
            format_offset: vec![],
            size: 0,
            offset_array: Vec::new(),
            instances_offset_array: None,
            total_length: 0,
            units: None,
            multipliers: None,
        }
    }
}

/// Aggregate counts after parsing selected message types.
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct ParseStats {
    /// Number of message groups in `ParseResult::messages`.
    pub message_count: usize,
    /// Total field columns across all messages.
    pub field_count: usize,
    /// Total scalar values across all columns.
    pub value_count: usize,
    /// Sum of [`FieldArray::estimated_bytes`] for all columns.
    pub estimated_bytes: usize,
}

/// Per-message-type size statistics from the FMT offset table.
#[derive(Debug, Clone)]
pub struct MessageStats {
    /// Number of messages in the log.
    pub count: usize,
    /// On-wire size including 3-byte header.
    pub msg_size: usize,
    /// `count * msg_size`.
    pub size: usize,
}

/// Log-level metadata collected during indexing and GPS time extraction.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct LogMetadata {
    /// UTC start time from GPS, when extracted via [`crate::LogSession::extract_start_time`].
    pub start_time: Option<DateTime<Utc>>,
    /// First `TimeUS` value in the log, in microseconds.
    pub start_time_us: Option<u64>,
    /// Raw `.BIN` file size in bytes.
    pub file_size: usize,
    /// Number of message types with at least one instance.
    pub message_type_count: usize,
}

/// Full parse output: schema, decoded messages, reconstructed files, and stats.
#[derive(Debug, Clone)]
pub struct ParseResult {
    /// Log metadata (file size, optional GPS start time).
    pub metadata: LogMetadata,
    /// Message type schema keyed by name (includes instanced keys).
    pub message_types: HashMap<String, MessageTypeInfo>,
    /// Decoded columns: message name → field name → [`FieldArray`].
    pub messages: HashMap<String, HashMap<String, FieldArray>>,
    /// Files reassembled from FILE messages (binary payloads).
    pub files: HashMap<String, Vec<u8>>,
    /// Aggregate stats for loaded messages.
    pub stats: ParseStats,
    /// Per-type on-disk size stats from the index pass.
    pub fmt_stats: HashMap<String, MessageStats>,
}

/// Default message types parsed by the CLI and JS reference parser.
pub const DEFAULT_MESSAGES: &[&str] = &[
    "CMD", "MSG", "FILE", "MODE", "AHR2", "ATT", "GPS", "POS", "XKQ1", "XKQ", "NKQ1", "NKQ2",
    "XKQ2", "PARM", "STAT", "EV",
];
