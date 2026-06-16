use std::collections::HashMap;
use std::fs::File;
use std::path::Path;
use std::sync::Arc;

use chrono::{DateTime, Utc};
use memmap2::Mmap;

use crate::error::{ParseError, Result};
use crate::parser::DataflashParser;
use crate::time::extract_start_time;
use crate::types::{FieldArray, LogMetadata, ParseResult};

/// Controls whether [`LogSession::load_messages`] parses types sequentially or in parallel.
///
/// Parallel parsing requires the `parallel` feature (enabled by default).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum Parallelism {
    /// Parse message types one after another (default).
    #[default]
    Sequential,
    /// Parse independent message types concurrently via rayon.
    #[cfg(feature = "parallel")]
    Parallel,
}

impl Parallelism {
    /// Returns `true` when parallel parsing is requested and the `parallel` feature is enabled.
    pub fn is_parallel(self) -> bool {
        #[cfg(feature = "parallel")]
        {
            matches!(self, Parallelism::Parallel)
        }
        #[cfg(not(feature = "parallel"))]
        {
            false
        }
    }
}

/// High-level session API for indexing and loading ArduPilot dataflash logs.
///
/// Typical workflow:
///
/// 1. [`LogSession::open`] or [`LogSession::from_bytes`]
/// 2. [`LogSession::index`] — scan headers, build schema (no payload decode)
/// 3. [`LogSession::load_message_type`] or [`LogSession::load_messages`]
/// 4. Optional [`LogSession::extract_start_time`]
/// 5. [`LogSession::into_result`] or [`LogSession::snapshot`]
///
/// For large logs (50+ MB), index first and load only the types you need.
pub struct LogSession {
    _mmap: Option<Mmap>,
    parser: DataflashParser,
    metadata: LogMetadata,
}

impl LogSession {
    /// Open a log file with read-only memory mapping.
    pub fn open(path: impl AsRef<Path>) -> Result<Self> {
        let file = File::open(path.as_ref())?;
        let mmap = unsafe { Mmap::map(&file)? };
        let buffer: Arc<[u8]> = Arc::from(mmap.as_ref());
        let file_size = buffer.len();
        let mut parser = DataflashParser::new();
        parser.set_buffer_arc(buffer);
        Ok(Self {
            _mmap: Some(mmap),
            parser,
            metadata: LogMetadata {
                start_time: None,
                start_time_us: None,
                file_size,
                message_type_count: 0,
            },
        })
    }

    /// Parse from an in-memory buffer (tests and embedded scenarios).
    pub fn from_bytes(data: Vec<u8>) -> Self {
        let file_size = data.len();
        let mut parser = DataflashParser::new();
        parser.set_buffer(data);
        Self {
            _mmap: None,
            parser,
            metadata: LogMetadata {
                start_time: None,
                start_time_us: None,
                file_size,
                message_type_count: 0,
            },
        }
    }

    /// Scan headers and build message type metadata without parsing payloads.
    pub fn index(&mut self) -> Result<()> {
        self.parser.index()?;
        self.metadata.message_type_count = self.parser.message_types().len();
        Ok(())
    }

    /// List message type names discovered during indexing.
    pub fn available_message_types(&self) -> Vec<String> {
        self.parser.message_types().keys().cloned().collect()
    }

    /// Parse one message type (public analog of JS `loadType`).
    pub fn load_message_type(&mut self, name: &str) -> Result<()> {
        self.parser.load_message_type(name)
    }

    /// Read one field from a message type.
    pub fn get(&self, name: &str, field: &str) -> Result<FieldArray> {
        self.parser.get(name, field)
    }

    /// Read one field from a specific instance.
    pub fn get_instance(&self, name: &str, instance: i64, field: &str) -> Result<FieldArray> {
        self.parser.get_instance(name, instance, field)
    }

    /// Load multiple message types, optionally in parallel (rayon feature).
    pub fn load_messages(&mut self, names: &[String], parallelism: Parallelism) -> Result<()> {
        let names = Self::expand_names_for_mode(names);

        if parallelism.is_parallel() {
            #[cfg(feature = "parallel")]
            {
                self.load_messages_parallel(&names)?;
                return Ok(());
            }
        }

        for name in &names {
            self.load_message_type(name)?;
        }
        Ok(())
    }

    fn expand_names_for_mode(names: &[String]) -> Vec<String> {
        let needs_msg = names
            .iter()
            .any(|n| n.split('[').next().unwrap_or(n) == "MODE")
            && !names
                .iter()
                .any(|n| n.split('[').next().unwrap_or(n) == "MSG");
        if needs_msg {
            let mut expanded = vec!["MSG".to_string()];
            expanded.extend(names.iter().cloned());
            expanded
        } else {
            names.to_vec()
        }
    }

    #[cfg(feature = "parallel")]
    fn load_messages_parallel(&mut self, names: &[String]) -> Result<()> {
        use rayon::prelude::*;

        if !self.parser.is_indexed() {
            return Err(ParseError::InvalidFormat(
                "call index() before load_messages".into(),
            ));
        }

        let buffer = self.parser.buffer_arc();
        let fmt_snapshot: HashMap<String, crate::types::FmtEntry> = self
            .parser
            .fmt_entries()
            .map(|e| (e.name.clone(), e.clone()))
            .collect();

        type ParsedBatch = Vec<(String, HashMap<String, FieldArray>)>;
        let batches: Result<Vec<ParsedBatch>> = names
            .par_iter()
            .map(|name| {
                let base = name.split('[').next().unwrap_or(name);
                let msg = match fmt_snapshot.get(base) {
                    Some(m) => m.clone(),
                    None => return Ok(vec![]),
                };

                if let Some(instances) = &msg.instances_offset_array {
                    let mut out = Vec::new();
                    for (inst, offsets) in instances {
                        let inst_name = format!("{base}[{inst}]");
                        let fields = parse_message_fields_standalone(&buffer, &msg, offsets)?;
                        out.push((inst_name, fields));
                    }
                    Ok(out)
                } else {
                    let fields = parse_message_fields_standalone(&buffer, &msg, &msg.offset_array)?;
                    Ok(vec![(base.to_string(), fields)])
                }
            })
            .collect();

        let parsed: Vec<(String, HashMap<String, FieldArray>)> =
            batches?.into_iter().flatten().collect();

        for (name, fields) in parsed {
            self.parser.messages_mut().insert(name, fields);
        }

        self.parser.recompute_mode_as_text();

        if names
            .iter()
            .any(|n| n.split('[').next().unwrap_or(n) == "FILE")
        {
            self.parser.process_files_mut();
        }

        Ok(())
    }

    /// Extract GPS-based log start time (requires GPS in message types).
    pub fn extract_start_time(&mut self) -> Result<Option<DateTime<Utc>>> {
        let start = extract_start_time(&self.parser)?;
        if let Some(dt) = start {
            self.metadata.start_time = Some(dt);
        }
        Ok(start)
    }

    /// Build a full `ParseResult` snapshot.
    pub fn snapshot(&self) -> ParseResult {
        self.parser.snapshot(self.metadata.clone())
    }

    /// Consume session and return `ParseResult`.
    pub fn into_result(self) -> ParseResult {
        self.snapshot()
    }

    /// Access the underlying [`DataflashParser`] (e.g. for low-level inspection).
    pub fn parser(&self) -> &DataflashParser {
        &self.parser
    }
}

#[cfg(feature = "parallel")]
fn parse_message_fields_standalone(
    buffer: &Arc<[u8]>,
    msg: &crate::types::FmtEntry,
    offsets: &[usize],
) -> Result<HashMap<String, FieldArray>> {
    use crate::format::{new_field_array, parse_type_at, store_parsed_value};

    let len = offsets.len();
    if len == 0 {
        return Ok(HashMap::new());
    }

    let mut parsed: HashMap<String, FieldArray> = HashMap::new();
    let mut time_index: Option<usize> = None;

    for (i, column) in msg.columns.iter().enumerate() {
        let type_char = msg.format.chars().nth(i).unwrap();
        if column == "TimeUS" {
            time_index = Some(i);
            parsed.insert(
                "time_boot_ms".to_string(),
                FieldArray::Numeric(vec![0.0; len]),
            );
        } else {
            parsed.insert(column.clone(), new_field_array(type_char, len));
        }
    }

    for (row, &msg_offset) in offsets.iter().enumerate() {
        let mut offset = msg_offset;
        for (j, column) in msg.columns.iter().enumerate() {
            let type_char = msg.format.chars().nth(j).unwrap();
            if Some(j) == time_index {
                let value = parse_type_at(buffer, &mut offset, type_char).map_err(|e| {
                    ParseError::FieldParseError {
                        message: msg.name.clone(),
                        field: "time_boot_ms".to_string(),
                        offset: msg_offset,
                        source: e.to_string(),
                    }
                })?;
                if let Some(v) = value.as_f64()
                    && let Some(FieldArray::Numeric(values)) = parsed.get_mut("time_boot_ms")
                {
                    values[row] = v / 1000.0;
                }
            } else if let Some(array) = parsed.get_mut(column) {
                let value = parse_type_at(buffer, &mut offset, type_char).map_err(|e| {
                    ParseError::FieldParseError {
                        message: msg.name.clone(),
                        field: column.clone(),
                        offset: msg_offset,
                        source: e.to_string(),
                    }
                })?;
                store_parsed_value(array, row, value);
            }
        }
    }

    Ok(parsed)
}
