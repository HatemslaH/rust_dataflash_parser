use std::collections::HashMap;

use base64::{Engine, engine::general_purpose::STANDARD};
use serde::Serialize;

use crate::types::{FieldArray, LogMetadata, MessageTypeInfo, ParseResult, ParseStats};

#[derive(Serialize)]
pub struct FieldArrayJson {
    #[serde(rename = "type")]
    kind: &'static str,
    values: FieldValuesJson,
}

#[derive(Serialize)]
#[serde(untagged)]
enum FieldValuesJson {
    Numeric(Vec<f64>),
    Text(Vec<String>),
    Int16x32(Vec<[i16; 32]>),
}

fn field_array_json(arr: &FieldArray) -> FieldArrayJson {
    match arr {
        FieldArray::Numeric(v) => FieldArrayJson {
            kind: "numeric",
            values: FieldValuesJson::Numeric(v.clone()),
        },
        FieldArray::Text(v) => FieldArrayJson {
            kind: "text",
            values: FieldValuesJson::Text(v.clone()),
        },
        FieldArray::Int16x32(v) => FieldArrayJson {
            kind: "int16x32",
            values: FieldValuesJson::Int16x32(v.clone()),
        },
    }
}

#[derive(Serialize)]
pub struct MessageStatsJson {
    count: usize,
    msg_size: usize,
    size: usize,
}

#[derive(Serialize)]
pub struct LogExport {
    pub schema_version: u32,
    pub metadata: LogMetadata,
    pub message_types: HashMap<String, MessageTypeInfo>,
    pub messages: HashMap<String, HashMap<String, FieldArrayJson>>,
    pub files: HashMap<String, String>,
    pub stats: ParseStats,
    pub fmt_stats: HashMap<String, MessageStatsJson>,
}

impl ParseResult {
    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string(&self.to_log_export())
    }

    pub fn to_json_pretty(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string_pretty(&self.to_log_export())
    }

    pub fn to_log_export(&self) -> LogExport {
        let messages = self
            .messages
            .iter()
            .map(|(name, fields)| {
                let mapped = fields
                    .iter()
                    .map(|(field, arr)| (field.clone(), field_array_json(arr)))
                    .collect();
                (name.clone(), mapped)
            })
            .collect();

        let files = self
            .files
            .iter()
            .map(|(k, v)| (k.clone(), STANDARD.encode(v)))
            .collect();

        let fmt_stats = self
            .fmt_stats
            .iter()
            .map(|(k, s)| {
                (
                    k.clone(),
                    MessageStatsJson {
                        count: s.count,
                        msg_size: s.msg_size,
                        size: s.size,
                    },
                )
            })
            .collect();

        LogExport {
            schema_version: 1,
            metadata: self.metadata.clone(),
            message_types: self.message_types.clone(),
            messages,
            files,
            stats: self.stats.clone(),
            fmt_stats,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::LogMetadata;

    #[test]
    fn json_export_has_schema_version() {
        let result = ParseResult {
            metadata: LogMetadata::default(),
            message_types: HashMap::new(),
            messages: HashMap::new(),
            files: HashMap::new(),
            stats: ParseStats::default(),
            fmt_stats: HashMap::new(),
        };
        let json = result.to_json().unwrap();
        assert!(json.contains("\"schema_version\":1"));
    }
}
