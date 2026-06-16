use std::collections::HashMap;
use std::sync::Arc;

use crate::error::{ParseError, Result};
use crate::format::{
    ParsedValue as ParsedField, compute_format_offsets, new_field_array, parse_type_at,
    store_parsed_value,
};
use crate::mode::{get_mode_string, multiplier_for_id, multiplier_table_display, unit_for_id};
use crate::types::{
    ComplexField, DEFAULT_MESSAGES, FMT_TYPE_ID, FieldArray, FmtEntry, HEAD1, HEAD2, LogMetadata,
    MessageStats, MessageTypeInfo, ParseResult, ParseStats,
};

/// Low-level dataflash parser engine.
///
/// Prefer [`crate::LogSession`] for application code. Use this type when you need direct
/// access to the FMT table, buffer, or incremental parsing primitives.
#[derive(Debug)]
pub struct DataflashParser {
    buffer: Arc<[u8]>,
    offset: usize,
    fmt: Vec<Option<FmtEntry>>,
    messages: HashMap<String, HashMap<String, FieldArray>>,
    message_types: HashMap<String, MessageTypeInfo>,
    files: HashMap<String, Vec<u8>>,
    indexed: bool,
}

impl Default for DataflashParser {
    fn default() -> Self {
        Self::new()
    }
}

impl DataflashParser {
    /// Create an empty parser with the built-in FMT bootstrap entry.
    pub fn new() -> Self {
        let mut parser = Self {
            buffer: Arc::new([]),
            offset: 0,
            fmt: vec![None; 256],
            messages: HashMap::new(),
            message_types: HashMap::new(),
            files: HashMap::new(),
            indexed: false,
        };
        parser.fmt[FMT_TYPE_ID as usize] = Some(FmtEntry::default_fmt());
        parser
    }

    /// Replace the log buffer (resets indexed state).
    pub fn set_buffer(&mut self, data: Vec<u8>) {
        self.buffer = Arc::from(data);
        self.indexed = false;
    }

    pub fn set_buffer_arc(&mut self, data: Arc<[u8]>) {
        self.buffer = data;
        self.indexed = false;
    }

    pub fn buffer_arc(&self) -> Arc<[u8]> {
        Arc::clone(&self.buffer)
    }

    pub fn messages_mut(&mut self) -> &mut HashMap<String, HashMap<String, FieldArray>> {
        &mut self.messages
    }

    pub fn process_files_mut(&mut self) {
        self.process_files();
    }

    pub fn buffer(&self) -> &[u8] {
        &self.buffer
    }

    /// Message type schema built by [`Self::index`].
    pub fn message_types(&self) -> &HashMap<String, MessageTypeInfo> {
        &self.message_types
    }

    /// Decoded message columns populated by [`Self::load_message_type`].
    pub fn messages(&self) -> &HashMap<String, HashMap<String, FieldArray>> {
        &self.messages
    }

    /// Binary files reassembled from FILE messages.
    pub fn files(&self) -> &HashMap<String, Vec<u8>> {
        &self.files
    }

    pub fn is_indexed(&self) -> bool {
        self.indexed
    }

    pub fn fmt_entries(&self) -> impl Iterator<Item = &FmtEntry> {
        self.fmt.iter().flatten()
    }

    pub fn read_type_at(&self, offset: &mut usize, type_char: char) -> Result<ParsedField> {
        parse_type_at(&self.buffer, offset, type_char)
    }

    /// Per-type on-disk size statistics from the FMT offset table.
    pub fn stats(&self) -> HashMap<String, MessageStats> {
        let mut ret = HashMap::new();
        for entry in self.fmt.iter().flatten() {
            let msg_size = entry.size + 3;
            let count = entry.total_length;
            ret.insert(
                entry.name.clone(),
                MessageStats {
                    count,
                    msg_size,
                    size: msg_size * count,
                },
            );
        }
        ret
    }

    fn get_fmt(&self, name: &str) -> Option<&FmtEntry> {
        self.fmt.iter().flatten().find(|fmt| fmt.name == name)
    }

    fn base_message_name(name: &str) -> &str {
        name.split('[').next().unwrap_or(name)
    }

    fn format_to_struct(&mut self, fmt: &FmtEntry) -> Result<HashMap<String, ParsedField>> {
        let mut dict = HashMap::new();
        for (idx, type_char) in fmt.format.chars().enumerate() {
            let column = fmt.columns[idx].clone();
            let value = parse_type_at(&self.buffer, &mut self.offset, type_char)?;
            dict.insert(column, value);
        }
        Ok(dict)
    }

    fn df_reader(&mut self) -> Result<()> {
        let mut msg_offset_array: Vec<Vec<usize>> = vec![Vec::new(); 256];
        self.offset = 0;

        while self.offset + 3 < self.buffer.len() {
            if self.buffer[self.offset] != HEAD1 || self.buffer[self.offset + 1] != HEAD2 {
                self.offset += 1;
                continue;
            }
            self.offset += 2;

            let attribute = self.buffer[self.offset] as usize;
            self.offset += 1;
            msg_offset_array[attribute].push(self.offset);

            if attribute == FMT_TYPE_ID as usize {
                if let Some(fmt_entry) = self.fmt[attribute].clone() {
                    let value = self.format_to_struct(&fmt_entry)?;
                    let format = value
                        .get("Format")
                        .and_then(|v| v.as_text())
                        .ok_or_else(|| ParseError::InvalidFormat("FMT missing Format".into()))?
                        .to_string();
                    let columns: Vec<String> = value
                        .get("Columns")
                        .and_then(|v| v.as_text())
                        .ok_or_else(|| ParseError::InvalidFormat("FMT missing Columns".into()))?
                        .split(',')
                        .map(str::to_string)
                        .collect();
                    let (format_offset, size) = compute_format_offsets(&format);
                    let type_id = value
                        .get("Type")
                        .and_then(|v| v.as_f64())
                        .ok_or_else(|| ParseError::InvalidFormat("FMT missing Type".into()))?
                        as u8;
                    let length = value
                        .get("Length")
                        .and_then(|v| v.as_f64())
                        .ok_or_else(|| ParseError::InvalidFormat("FMT missing Length".into()))?
                        as u8;
                    let name = value
                        .get("Name")
                        .and_then(|v| v.as_text())
                        .ok_or_else(|| ParseError::InvalidFormat("FMT missing Name".into()))?
                        .to_string();

                    self.fmt[type_id as usize] = Some(FmtEntry {
                        type_id,
                        length,
                        name,
                        format,
                        columns,
                        format_offset,
                        size,
                        offset_array: Vec::new(),
                        instances_offset_array: None,
                        total_length: 0,
                        units: None,
                        multipliers: None,
                    });
                }
            } else if let Some(size) = self.fmt[attribute].as_ref().map(|e| e.size) {
                self.offset += size;
            }
        }

        for (type_id, entry_opt) in self.fmt.iter_mut().enumerate() {
            let Some(entry) = entry_opt else { continue };
            let offsets = std::mem::take(&mut msg_offset_array[type_id]);
            if offsets.is_empty() {
                entry.total_length = 0;
                entry.offset_array.clear();
                continue;
            }
            entry.offset_array = offsets;
            if let Some(last) = entry.offset_array.last() {
                let msg_end = last + entry.size;
                if msg_end > self.buffer.len() {
                    entry.offset_array.pop();
                }
            }
            entry.total_length = entry.offset_array.len();
        }

        Ok(())
    }

    fn populate_units(&mut self) -> Result<()> {
        let fmtu = match self.get_instance_fields("FMTU", None, None) {
            Ok(m) => m,
            Err(ParseError::UnknownMessageType(_)) => return Ok(()),
            Err(e) => return Err(e),
        };
        if fmtu.is_empty() {
            return Ok(());
        }
        let fmt_types = match fmtu.get("FmtType") {
            Some(FieldArray::Numeric(v)) => v.clone(),
            _ => return Ok(()),
        };
        let unit_ids = match fmtu.get("UnitIds") {
            Some(FieldArray::Text(v)) => v.clone(),
            _ => return Ok(()),
        };
        let mult_ids = match fmtu.get("MultIds") {
            Some(FieldArray::Text(v)) => v.clone(),
            _ => return Ok(()),
        };

        for (index, type_val) in fmt_types.iter().enumerate() {
            let type_id = *type_val as usize;
            let Some(entry) = self.fmt.get_mut(type_id).and_then(|e| e.as_mut()) else {
                continue;
            };

            let unit_chars: Vec<char> = unit_ids
                .get(index)
                .map(|s| s.chars().collect())
                .unwrap_or_default();
            let mult_chars: Vec<char> = mult_ids
                .get(index)
                .map(|s| s.chars().collect())
                .unwrap_or_default();

            entry.units = Some(
                unit_chars
                    .iter()
                    .map(|&c| unit_for_id(c).to_string())
                    .collect(),
            );
            entry.multipliers = Some(mult_chars.iter().map(|&c| multiplier_for_id(c)).collect());
        }
        Ok(())
    }

    fn check_number_of_instances(&mut self, msg: &mut FmtEntry) -> Option<Vec<i64>> {
        let units = msg.units.as_ref()?;
        let instance_index = units.iter().position(|u| u == "instance")?;
        let instance_offset = msg.format_offset[instance_index];
        let instance_type = msg.format.chars().nth(instance_index)?;

        let mut available_instances = Vec::new();
        let mut instances_offset_array: HashMap<i64, Vec<usize>> = HashMap::new();
        let offsets = msg.offset_array.clone();

        for &msg_offset in &offsets {
            let mut offset = msg_offset + instance_offset;
            let instance_val = parse_type_at(&self.buffer, &mut offset, instance_type)
                .ok()?
                .as_f64()?;
            let instance = instance_val as i64;
            if let std::collections::hash_map::Entry::Vacant(e) =
                instances_offset_array.entry(instance)
            {
                e.insert(Vec::new());
                available_instances.push(instance);
            }
            instances_offset_array
                .get_mut(&instance)
                .unwrap()
                .push(msg_offset);
        }

        msg.instances_offset_array = Some(instances_offset_array);
        msg.offset_array.clear();
        Some(available_instances)
    }

    fn parse_message_fields(
        &self,
        msg: &FmtEntry,
        offsets: &[usize],
    ) -> Result<HashMap<String, FieldArray>> {
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
                    let value =
                        parse_type_at(&self.buffer, &mut offset, type_char).map_err(|e| {
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
                    let value =
                        parse_type_at(&self.buffer, &mut offset, type_char).map_err(|e| {
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

    /// Index the log: scan headers, populate units, build message type metadata. No payload parsing.
    pub fn index(&mut self) -> Result<()> {
        self.messages.clear();
        self.message_types.clear();
        self.files.clear();
        self.offset = 0;

        self.df_reader()?;
        self.populate_units()?;
        self.build_message_types()?;
        self.indexed = true;
        Ok(())
    }

    /// Parse all fields for one message type into `messages`.
    pub fn load_message_type(&mut self, name: &str) -> Result<()> {
        if !self.indexed {
            return Err(ParseError::InvalidFormat(
                "call index() before load_message_type".into(),
            ));
        }
        let base = Self::base_message_name(name);
        self.parse_at_offset(base)?;
        if base == "FILE" {
            self.process_files();
        }
        Ok(())
    }

    fn parse_at_offset(&mut self, name: &str) -> Result<()> {
        let msg = match self.get_fmt(name) {
            Some(msg) => msg.clone(),
            None => return Ok(()),
        };

        if let Some(instances) = &msg.instances_offset_array {
            for (index, offsets) in instances {
                let inst_name = format!("{name}[{index}]");
                let parsed = self.parse_message_fields(&msg, offsets)?;
                self.messages.insert(inst_name, parsed);
            }
            return Ok(());
        }

        let parsed = self.parse_message_fields(&msg, &msg.offset_array)?;
        if msg.name == "MODE" {
            let mut parsed = parsed;
            if let Some(FieldArray::Numeric(modes)) = parsed.get("Mode").cloned() {
                let msg_texts =
                    self.messages
                        .get("MSG")
                        .and_then(|m| m.get("Message"))
                        .map(|arr| match arr {
                            FieldArray::Text(v) => v.clone(),
                            _ => Vec::new(),
                        });
                let as_text: Vec<String> = modes
                    .iter()
                    .map(|mode| get_mode_string(*mode, msg_texts.as_deref()))
                    .collect();
                parsed.insert("asText".to_string(), FieldArray::Text(as_text));
            }
            self.messages.insert(name.to_string(), parsed);
        } else {
            self.messages.insert(name.to_string(), parsed);
        }
        Ok(())
    }

    /// Read one field from a message type (no instance).
    pub fn get(&self, name: &str, field: &str) -> Result<FieldArray> {
        let fields = self.get_instance_fields(name, None, Some(field))?;
        fields
            .get(field)
            .cloned()
            .ok_or_else(|| ParseError::UnknownField(field.to_string()))
    }

    /// Read one field from a specific instance.
    pub fn get_instance(&self, name: &str, instance: i64, field: &str) -> Result<FieldArray> {
        let fields = self.get_instance_fields(name, Some(instance), Some(field))?;
        fields
            .get(field)
            .cloned()
            .ok_or_else(|| ParseError::UnknownField(field.to_string()))
    }

    fn get_instance_fields(
        &self,
        name: &str,
        instance: Option<i64>,
        field: Option<&str>,
    ) -> Result<HashMap<String, FieldArray>> {
        let base = Self::base_message_name(name);
        let msg = self
            .get_fmt(base)
            .ok_or_else(|| ParseError::UnknownMessageType(base.to_string()))?;

        let offsets = if let Some(inst) = instance {
            let instances = msg
                .instances_offset_array
                .as_ref()
                .ok_or(ParseError::UnknownInstance(inst))?;
            let offsets = instances
                .get(&inst)
                .ok_or(ParseError::UnknownInstance(inst))?;
            offsets.as_slice()
        } else {
            msg.offset_array.as_slice()
        };

        if offsets.is_empty() {
            return Ok(HashMap::new());
        }

        if let Some(field_name) = field {
            let field_index = msg
                .columns
                .iter()
                .position(|c| c == field_name)
                .ok_or_else(|| ParseError::UnknownField(field_name.to_string()))?;
            let field_offset = msg.format_offset[field_index];
            let type_char = msg.format.chars().nth(field_index).unwrap();
            let mut array = new_field_array(type_char, offsets.len());
            for (i, &msg_offset) in offsets.iter().enumerate() {
                let mut offset = msg_offset + field_offset;
                let value = parse_type_at(&self.buffer, &mut offset, type_char).map_err(|e| {
                    ParseError::FieldParseError {
                        message: msg.name.clone(),
                        field: field_name.to_string(),
                        offset: msg_offset,
                        source: e.to_string(),
                    }
                })?;
                store_parsed_value(&mut array, i, value);
            }
            return Ok(HashMap::from([(field_name.to_string(), array)]));
        }

        self.parse_message_fields(msg, offsets)
    }

    fn process_files(&mut self) {
        let file_msg = match self.messages.get("FILE") {
            Some(msg) => msg.clone(),
            None => return,
        };

        let names = match file_msg.get("FileName") {
            Some(FieldArray::Text(v)) => v.clone(),
            _ => return,
        };
        let data_parts = match file_msg.get("Data") {
            Some(FieldArray::Text(v)) => v.clone(),
            _ => return,
        };

        for (name, data) in names.into_iter().zip(data_parts) {
            let chunk = data.into_bytes();
            self.files
                .entry(name)
                .and_modify(|existing| existing.extend_from_slice(&chunk))
                .or_insert(chunk);
        }
    }

    fn build_message_types(&mut self) -> Result<()> {
        let mut message_types = HashMap::new();
        let fmt_entries: Vec<FmtEntry> = self.fmt.iter().flatten().cloned().collect();

        for mut msg in fmt_entries {
            if msg.total_length == 0 {
                continue;
            }

            let mut complex_fields = HashMap::new();
            for (i, field) in msg.columns.iter().enumerate() {
                let units = msg.units.as_ref().and_then(|u| u.get(i)).cloned();
                let multiplier = msg
                    .multipliers
                    .as_ref()
                    .and_then(|m| m.get(i))
                    .copied()
                    .unwrap_or(1.0);
                let unit_display = if msg.units.is_none() {
                    "?".to_string()
                } else {
                    let prefix = multiplier_table_display(multiplier);
                    format!("{prefix}{}", units.as_deref().unwrap_or(""))
                };
                complex_fields.insert(
                    field.clone(),
                    ComplexField {
                        name: field.clone(),
                        units: unit_display,
                        multiplier,
                    },
                );
            }

            let info = MessageTypeInfo {
                expressions: msg.columns.clone(),
                units: msg.units.clone(),
                multipliers: msg.multipliers.clone(),
                complex_fields: complex_fields.clone(),
                instances: None,
            };
            message_types.insert(msg.name.clone(), info);

            if let Some(available_instances) = self.check_number_of_instances(&mut msg) {
                if let Some(entry) = self
                    .fmt
                    .iter_mut()
                    .find_map(|e| e.as_mut().filter(|e| e.name == msg.name))
                {
                    *entry = msg.clone();
                }

                let mut instances_map = HashMap::new();
                for instance in available_instances {
                    let inst_name = format!("{}[{instance}]", msg.name);
                    instances_map.insert(instance, inst_name.clone());
                    message_types.insert(
                        inst_name,
                        MessageTypeInfo {
                            expressions: msg.columns.clone(),
                            units: msg.units.clone(),
                            multipliers: msg.multipliers.clone(),
                            complex_fields: complex_fields.clone(),
                            instances: None,
                        },
                    );
                }
                if let Some(info) = message_types.get_mut(&msg.name) {
                    info.instances = Some(instances_map);
                }
            }
        }

        self.message_types = message_types;
        Ok(())
    }

    fn compute_parse_stats(&self) -> ParseStats {
        let mut stats = ParseStats {
            message_count: self.messages.len(),
            ..ParseStats::default()
        };
        for fields in self.messages.values() {
            stats.field_count += fields.len();
            for array in fields.values() {
                stats.value_count += array.len();
                stats.estimated_bytes += array.estimated_bytes();
            }
        }
        stats
    }

    /// Build a [`ParseResult`] from the current parser state and metadata.
    pub fn snapshot(&self, metadata: LogMetadata) -> ParseResult {
        ParseResult {
            metadata,
            message_types: self.message_types.clone(),
            messages: self.messages.clone(),
            files: self.files.clone(),
            stats: self.compute_parse_stats(),
            fmt_stats: self.stats(),
        }
    }

    /// Full parse pipeline matching `DataflashParser.processData` in JS.
    ///
    /// # Deprecated
    ///
    /// Use [`LogSession`](crate::LogSession) instead: `open` → `index` → `load_messages`.
    #[deprecated(note = "use LogSession")]
    pub fn process_data(
        &mut self,
        data: Vec<u8>,
        msgs: Option<Vec<String>>,
    ) -> Result<ParseResult> {
        self.set_buffer(data);
        self.index()?;

        let message_list = msgs.unwrap_or_else(|| {
            DEFAULT_MESSAGES
                .iter()
                .map(|s| s.to_string())
                .collect::<Vec<_>>()
        });

        for msg in message_list {
            self.load_message_type(&msg)?;
        }

        let metadata = LogMetadata {
            start_time: None,
            start_time_us: None,
            file_size: self.buffer.len(),
            message_type_count: self.message_types.len(),
        };

        Ok(self.snapshot(metadata))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::format::get_size_of;

    #[test]
    fn parser_constructs_with_default_fmt() {
        let parser = DataflashParser::new();
        let fmt = parser.fmt[FMT_TYPE_ID as usize].as_ref().unwrap();
        assert_eq!(fmt.name, "FMT");
    }

    #[test]
    fn get_size_of_matches_js() {
        assert_eq!(get_size_of('f'), Some(4));
        assert_eq!(get_size_of('Q'), Some(8));
        assert_eq!(get_size_of('Z'), Some(64));
    }

    #[test]
    fn get_unknown_message_type_errors() {
        let parser = DataflashParser::new();
        let err = parser.get("NOPE", "TimeUS").unwrap_err();
        assert!(matches!(err, ParseError::UnknownMessageType(_)));
    }

    #[test]
    fn index_on_empty_buffer() {
        let mut parser = DataflashParser::new();
        parser.set_buffer(Vec::new());
        parser.index().unwrap();
        assert!(parser.is_indexed());
    }
}
