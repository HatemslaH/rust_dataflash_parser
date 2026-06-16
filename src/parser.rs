use std::collections::HashMap;

use crate::error::{ParseError, Result};
use crate::format::{
    ParsedValue as ParsedField, compute_format_offsets, new_field_array, parse_type_at,
    store_parsed_value,
};
use crate::mode::{get_mode_string, multiplier_for_id, multiplier_table_display, unit_for_id};
use crate::types::{
    ComplexField, DEFAULT_MESSAGES, FMT_TYPE_ID, FieldArray, FmtEntry, HEAD1, HEAD2,
    MessageTypeInfo, ParseResult, ParseStats,
};

/// Fast Rust port of JsDataflashParser (`JsDataflashParser/parser.js`).
#[derive(Debug, Default)]
pub struct DataflashParser {
    buffer: Vec<u8>,
    fmt: Vec<Option<FmtEntry>>,
    offset: usize,
    messages: HashMap<String, HashMap<String, FieldArray>>,
    message_types: HashMap<String, MessageTypeInfo>,
    files: HashMap<String, Vec<u8>>,
}

impl DataflashParser {
    pub fn new() -> Self {
        let mut parser = Self::default();
        parser.fmt.resize(256, None);
        parser.fmt[FMT_TYPE_ID as usize] = Some(FmtEntry::default_fmt());
        parser
    }

    pub fn message_types(&self) -> &HashMap<String, MessageTypeInfo> {
        &self.message_types
    }

    pub fn messages(&self) -> &HashMap<String, HashMap<String, FieldArray>> {
        &self.messages
    }

    pub fn files(&self) -> &HashMap<String, Vec<u8>> {
        &self.files
    }

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
        let fmtu = self.get_instance("FMTU", None, None);
        let Some(fmtu) = fmtu else { return Ok(()) };

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
            if !instances_offset_array.contains_key(&instance) {
                instances_offset_array.insert(instance, Vec::new());
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
                    let value = parse_type_at(&self.buffer, &mut offset, type_char)?;
                    if let Some(v) = value.as_f64() {
                        if let Some(FieldArray::Numeric(values)) = parsed.get_mut("time_boot_ms") {
                            values[row] = v / 1000.0;
                        }
                    }
                } else if let Some(array) = parsed.get_mut(column) {
                    let value = parse_type_at(&self.buffer, &mut offset, type_char)?;
                    store_parsed_value(array, row, value);
                }
            }
        }

        Ok(parsed)
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

    fn get_instance(
        &self,
        name: &str,
        instance: Option<i64>,
        field: Option<&str>,
    ) -> Option<HashMap<String, FieldArray>> {
        let msg = self.get_fmt(name)?;
        let offsets = if let Some(inst) = instance {
            msg.instances_offset_array.as_ref()?.get(&inst)?
        } else {
            &msg.offset_array
        };

        if offsets.is_empty() {
            return None;
        }

        if let Some(field_name) = field {
            let field_index = msg.columns.iter().position(|c| c == field_name)?;
            let field_offset = msg.format_offset[field_index];
            let type_char = msg.format.chars().nth(field_index)?;
            let mut array = new_field_array(type_char, offsets.len());
            for (i, &msg_offset) in offsets.iter().enumerate() {
                let mut offset = msg_offset + field_offset;
                if let Ok(value) = parse_type_at(&self.buffer, &mut offset, type_char) {
                    store_parsed_value(&mut array, i, value);
                }
            }
            return Some(HashMap::from([(field_name.to_string(), array)]));
        }

        self.parse_message_fields(msg, offsets).ok()
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
        let mut stats = ParseStats::default();
        stats.message_count = self.messages.len();
        for fields in self.messages.values() {
            stats.field_count += fields.len();
            for array in fields.values() {
                stats.value_count += array.len();
                stats.estimated_bytes += array.estimated_bytes();
            }
        }
        stats
    }

    /// Full parse pipeline matching `DataflashParser.processData` in JS.
    pub fn process_data(
        &mut self,
        data: Vec<u8>,
        msgs: Option<Vec<String>>,
    ) -> Result<ParseResult> {
        self.buffer = data;
        self.offset = 0;
        self.messages.clear();
        self.message_types.clear();
        self.files.clear();

        self.df_reader()?;
        let _ = self.populate_units();
        self.build_message_types()?;

        let message_list = msgs.unwrap_or_else(|| {
            DEFAULT_MESSAGES
                .iter()
                .map(|s| s.to_string())
                .collect::<Vec<_>>()
        });

        for msg in message_list {
            self.parse_at_offset(&msg)?;
            if msg == "FILE" {
                self.process_files();
            }
        }

        Ok(ParseResult {
            message_types: self.message_types.clone(),
            messages: self.messages.clone(),
            stats: self.compute_parse_stats(),
        })
    }
}

#[derive(Debug, Clone, Copy)]
pub struct MessageStats {
    pub count: usize,
    pub msg_size: usize,
    pub size: usize,
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
}
