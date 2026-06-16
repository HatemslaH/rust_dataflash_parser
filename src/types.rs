use std::collections::HashMap;

pub const HEAD1: u8 = 163;
pub const HEAD2: u8 = 149;
pub const FMT_TYPE_ID: u8 = 128;

/// Parsed values for one column across all instances of a message.
#[derive(Debug, Clone)]
pub enum FieldArray {
    Numeric(Vec<f64>),
    Text(Vec<String>),
    Int16x32(Vec<[i16; 32]>),
}

impl FieldArray {
    pub fn len(&self) -> usize {
        match self {
            FieldArray::Numeric(v) => v.len(),
            FieldArray::Text(v) => v.len(),
            FieldArray::Int16x32(v) => v.len(),
        }
    }

    pub fn estimated_bytes(&self) -> usize {
        match self {
            FieldArray::Numeric(v) => v.len() * std::mem::size_of::<f64>(),
            FieldArray::Text(v) => v.iter().map(|s| s.len() + std::mem::size_of::<String>()).sum(),
            FieldArray::Int16x32(v) => v.len() * 64,
        }
    }
}

#[derive(Debug, Clone)]
pub struct ComplexField {
    pub name: String,
    pub units: String,
    pub multiplier: f64,
}

#[derive(Debug, Clone)]
pub struct MessageTypeInfo {
    pub expressions: Vec<String>,
    pub units: Option<Vec<String>>,
    pub multipliers: Option<Vec<f64>>,
    pub complex_fields: HashMap<String, ComplexField>,
    pub instances: Option<HashMap<i64, String>>,
}

#[derive(Debug, Clone)]
pub struct FmtEntry {
    pub type_id: u8,
    pub length: u8,
    pub name: String,
    pub format: String,
    pub columns: Vec<String>,
    pub format_offset: Vec<usize>,
    pub size: usize,
    pub offset_array: Vec<usize>,
    pub instances_offset_array: Option<HashMap<i64, Vec<usize>>>,
    pub total_length: usize,
    pub units: Option<Vec<String>>,
    pub multipliers: Option<Vec<f64>>,
}

impl FmtEntry {
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

#[derive(Debug, Default)]
pub struct ParseStats {
    pub message_count: usize,
    pub field_count: usize,
    pub value_count: usize,
    pub estimated_bytes: usize,
}

#[derive(Debug, Default)]
pub struct ParseResult {
    pub message_types: HashMap<String, MessageTypeInfo>,
    pub messages: HashMap<String, HashMap<String, FieldArray>>,
    pub stats: ParseStats,
}

pub const DEFAULT_MESSAGES: &[&str] = &[
    "CMD", "MSG", "FILE", "MODE", "AHR2", "ATT", "GPS", "POS", "XKQ1", "XKQ", "NKQ1", "NKQ2",
    "XKQ2", "PARM", "STAT", "EV",
];
