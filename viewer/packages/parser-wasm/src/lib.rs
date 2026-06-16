use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use rust_dataflash_parser::{LogSession, MessageStats, FieldArray};
use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LogSummary {
    pub file_name: String,
    pub file_size: usize,
    pub message_type_count: usize,
    pub available_types: Vec<String>,
    pub fmt_stats: serde_json::Value,
    pub start_time: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageTypeEntry {
    pub name: String,
    pub count: u64,
    pub loaded: bool,
    pub fields: Vec<FieldInfo>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FieldInfo {
    pub name: String,
    pub units: Option<String>,
    pub multiplier: Option<f64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LogMetadata {
    pub start_time: Option<String>,
    pub file_size: usize,
    pub message_type_count: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FieldSeries {
    #[serde(rename = "type")]
    pub series_type: String,
    pub values: serde_json::Value,
}

#[wasm_bindgen]
pub struct WasmLogSession {
    session: LogSession,
}

#[wasm_bindgen]
impl WasmLogSession {
    #[wasm_bindgen(constructor)]
    pub fn new(data: Vec<u8>) -> Self {
        let session = LogSession::from_bytes(data);
        Self { session }
    }

    pub fn index(&mut self) -> Result<(), JsValue> {
        self.session.index().map_err(|e| JsValue::from_str(&e.to_string()))
    }

    pub fn available_message_types(&self) -> Result<JsValue, JsValue> {
        let types = self.session.available_message_types();
        serde_wasm_bindgen::to_value(&types).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    pub fn list_message_types(&self) -> Result<JsValue, JsValue> {
        let parser = self.session.parser();
        let stats = parser.stats();
        let loaded = parser.messages();
        let schema = parser.message_types();

        let types: Vec<MessageTypeEntry> = self.session
            .available_message_types()
            .into_iter()
            .map(|name| {
                let base = name.split('[').next().unwrap_or(&name).to_string();
                let count = stats.get(&base).map(|s| s.count as u64).unwrap_or(0);
                let fields = schema
                    .get(&base)
                    .map(|info| {
                        info.expressions
                            .iter()
                            .filter(|col| *col != "TimeUS")
                            .map(|col| {
                                let meta = info.complex_fields.get(col);
                                FieldInfo {
                                    name: col.clone(),
                                    units: meta.map(|m| m.units.clone()).filter(|u| !u.is_empty()),
                                    multiplier: meta.map(|m| m.multiplier),
                                }
                            })
                            .collect()
                    })
                    .unwrap_or_default();

                MessageTypeEntry {
                    name: name.clone(),
                    count,
                    loaded: loaded.contains_key(&name),
                    fields,
                }
            })
            .collect();

        serde_wasm_bindgen::to_value(&types).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    pub fn load_message_types(&mut self, names: Vec<String>) -> Result<(), JsValue> {
        for name in names {
            self.session
                .load_message_type(&name)
                .map_err(|e| JsValue::from_str(&e.to_string()))?;
        }
        Ok(())
    }

    pub fn get_field_series(&self, type_name: &str, field: &str, instance: Option<i64>) -> Result<JsValue, JsValue> {
        let array = if let Some(id) = instance {
            self.session.get_instance(type_name, id, field)
        } else {
            self.session.get(type_name, field)
        }.map_err(|e| JsValue::from_str(&e.to_string()))?;

        let series = field_array_to_series(array);
        serde_wasm_bindgen::to_value(&series).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    pub fn get_metadata(&self) -> Result<JsValue, JsValue> {
        let snapshot = self.session.snapshot();
        let metadata = LogMetadata {
            start_time: snapshot.metadata.start_time.map(|t| t.to_rfc3339()),
            file_size: snapshot.metadata.file_size,
            message_type_count: snapshot.metadata.message_type_count,
        };
        serde_wasm_bindgen::to_value(&metadata).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    pub fn build_summary(&self, file_name: &str) -> Result<JsValue, JsValue> {
        let snapshot = self.session.snapshot();
        let available_types = self.session.available_message_types();
        let fmt_stats = stats_to_json(self.session.parser().stats());

        let summary = LogSummary {
            file_name: file_name.to_string(),
            file_size: snapshot.metadata.file_size,
            message_type_count: snapshot.metadata.message_type_count,
            available_types,
            fmt_stats,
            start_time: snapshot.metadata.start_time.map(|t| t.to_rfc3339()),
        };
        serde_wasm_bindgen::to_value(&summary).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

fn stats_to_json(stats: HashMap<String, MessageStats>) -> serde_json::Value {
    let map: serde_json::Map<String, serde_json::Value> = stats
        .into_iter()
        .map(|(name, stat)| {
            (
                name,
                serde_json::json!({
                    "count": stat.count,
                    "msg_size": stat.msg_size,
                    "size": stat.size,
                }),
            )
        })
        .collect();
    serde_json::Value::Object(map)
}

fn field_array_to_series(array: FieldArray) -> FieldSeries {
    match array {
        FieldArray::Numeric(values) => FieldSeries {
            series_type: "numeric".to_string(),
            values: serde_json::json!(values),
        },
        FieldArray::Text(values) => FieldSeries {
            series_type: "text".to_string(),
            values: serde_json::json!(values),
        },
        FieldArray::Int16x32(values) => FieldSeries {
            series_type: "int16x32".to_string(),
            values: serde_json::json!(values),
        },
    }
}
