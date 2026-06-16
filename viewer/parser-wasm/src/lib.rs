use std::collections::HashSet;

use js_sys::{Float64Array, Object, Reflect};
use rust_dataflash_parser::{FieldArray, LogSession, Parallelism};
use serde::Serialize;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct WasmLogSession {
    session: Option<LogSession>,
    file_name: String,
    loaded_types: HashSet<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FieldInfoJs {
    name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    units: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    multiplier: Option<f64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct MessageTypeEntryJs {
    name: String,
    count: usize,
    loaded: bool,
    fields: Vec<FieldInfoJs>,
}

#[derive(Serialize)]
struct FmtStatJs {
    count: usize,
    msg_size: usize,
    size: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LogSummaryJs {
    file_name: String,
    file_size: usize,
    message_type_count: usize,
    available_types: Vec<String>,
    fmt_stats: std::collections::HashMap<String, FmtStatJs>,
    #[serde(skip_serializing_if = "Option::is_none")]
    start_time: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LogMetadataJs {
    #[serde(skip_serializing_if = "Option::is_none")]
    start_time: Option<String>,
    file_size: usize,
    message_type_count: usize,
}

fn parse_error(err: rust_dataflash_parser::ParseError) -> JsValue {
    JsValue::from_str(&err.to_string())
}

fn to_js<T: Serialize>(value: &T) -> Result<JsValue, JsValue> {
    serde_wasm_bindgen::to_value(value).map_err(|e| JsValue::from_str(&e.to_string()))
}

fn base_message_name(name: &str) -> &str {
    name.split('[').next().unwrap_or(name)
}

fn parse_instance(type_name: &str) -> Option<i64> {
    let base = base_message_name(type_name);
    let suffix = type_name.strip_prefix(base)?;
    let inner = suffix.strip_prefix('[')?.strip_suffix(']')?;
    inner.parse().ok()
}

fn message_count(session: &LogSession, type_name: &str) -> usize {
    let base = base_message_name(type_name);
    for entry in session.parser().fmt_entries() {
        if entry.name != base {
            continue;
        }
        if let Some(inst) = parse_instance(type_name) {
            return entry
                .instances_offset_array
                .as_ref()
                .and_then(|m| m.get(&inst))
                .map(|offsets| offsets.len())
                .unwrap_or(0);
        }
        return entry.total_length;
    }
    0
}

fn should_list_type(_name: &str, info: &rust_dataflash_parser::MessageTypeInfo) -> bool {
    !info
        .instances
        .as_ref()
        .is_some_and(|instances| !instances.is_empty())
}

fn build_fields(info: &rust_dataflash_parser::MessageTypeInfo) -> Vec<FieldInfoJs> {
    info.expressions
        .iter()
        .map(|name| {
            let complex = info.complex_fields.get(name);
            FieldInfoJs {
                name: name.clone(),
                units: complex.map(|c| c.units.clone()),
                multiplier: complex.map(|c| c.multiplier),
            }
        })
        .collect()
}

fn field_array_to_js(arr: &FieldArray) -> Result<JsValue, JsValue> {
    let obj = Object::new();
    match arr {
        FieldArray::Numeric(values) => {
            Reflect::set(&obj, &JsValue::from_str("type"), &JsValue::from_str("numeric"))?;
            let typed = Float64Array::from(values.as_slice());
            Reflect::set(&obj, &JsValue::from_str("values"), &typed)?;
        }
        FieldArray::Text(values) => {
            Reflect::set(&obj, &JsValue::from_str("type"), &JsValue::from_str("text"))?;
            Reflect::set(&obj, &JsValue::from_str("values"), &to_js(values)?)?;
        }
        FieldArray::Int16x32(values) => {
            Reflect::set(
                &obj,
                &JsValue::from_str("type"),
                &JsValue::from_str("int16x32"),
            )?;
            Reflect::set(&obj, &JsValue::from_str("values"), &to_js(values)?)?;
        }
    }
    Ok(obj.into())
}

fn mark_loaded_types(session: &LogSession, loaded: &mut HashSet<String>, names: &[String]) {
    for name in names {
        loaded.insert(name.clone());
        let base = base_message_name(name);
        if let Some(info) = session.parser().message_types().get(base)
            && let Some(instances) = &info.instances
        {
            for inst_name in instances.values() {
                loaded.insert(inst_name.clone());
            }
            loaded.insert(base.to_string());
        }
    }
}

#[wasm_bindgen]
impl WasmLogSession {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            session: None,
            file_name: String::new(),
            loaded_types: HashSet::new(),
        }
    }

    #[wasm_bindgen(js_name = fromBytes)]
    pub fn from_bytes(data: &[u8], file_name: &str) -> Result<WasmLogSession, JsValue> {
        let mut session = LogSession::from_bytes(data.to_vec());
        session.index().map_err(parse_error)?;
        let _ = session.extract_start_time();

        Ok(Self {
            session: Some(session),
            file_name: file_name.to_string(),
            loaded_types: HashSet::new(),
        })
    }

    #[wasm_bindgen(js_name = close)]
    pub fn close(&mut self) {
        self.session = None;
        self.file_name.clear();
        self.loaded_types.clear();
    }

    #[wasm_bindgen(js_name = summary)]
    pub fn summary(&self) -> Result<JsValue, JsValue> {
        let session = self
            .session
            .as_ref()
            .ok_or_else(|| JsValue::from_str("no log open"))?;
        let parser = session.parser();
        let fmt_stats = parser
            .stats()
            .into_iter()
            .map(|(name, stat)| {
                (
                    name,
                    FmtStatJs {
                        count: stat.count,
                        msg_size: stat.msg_size,
                        size: stat.size,
                    },
                )
            })
            .collect();

        let available_types: Vec<String> = parser
            .message_types()
            .iter()
            .filter(|(name, info)| should_list_type(name, info))
            .map(|(name, _)| name.clone())
            .collect();

        let metadata = session.snapshot().metadata;
        let start_time = metadata.start_time.map(|dt| dt.to_rfc3339());

        to_js(&LogSummaryJs {
            file_name: self.file_name.clone(),
            file_size: metadata.file_size,
            message_type_count: available_types.len(),
            available_types,
            fmt_stats,
            start_time,
        })
    }

    #[wasm_bindgen(js_name = listMessageTypes)]
    pub fn list_message_types(&self) -> Result<JsValue, JsValue> {
        let session = self
            .session
            .as_ref()
            .ok_or_else(|| JsValue::from_str("no log open"))?;
        let parser = session.parser();

        let mut entries: Vec<MessageTypeEntryJs> = parser
            .message_types()
            .iter()
            .filter(|(name, info)| should_list_type(name, info))
            .map(|(name, info)| MessageTypeEntryJs {
                name: name.clone(),
                count: message_count(session, name),
                loaded: self.loaded_types.contains(name) || parser.messages().contains_key(name),
                fields: build_fields(info),
            })
            .collect();

        entries.sort_by(|a, b| a.name.cmp(&b.name));
        to_js(&entries)
    }

    #[wasm_bindgen(js_name = loadMessageTypes)]
    pub fn load_message_types(&mut self, names: Vec<String>) -> Result<(), JsValue> {
        let session = self
            .session
            .as_mut()
            .ok_or_else(|| JsValue::from_str("no log open"))?;
        session
            .load_messages(&names, Parallelism::Sequential)
            .map_err(parse_error)?;
        mark_loaded_types(session, &mut self.loaded_types, &names);
        Ok(())
    }

    #[wasm_bindgen(js_name = getFieldSeries)]
    pub fn get_field_series(
        &self,
        message_type: &str,
        field: &str,
        instance: Option<i32>,
    ) -> Result<JsValue, JsValue> {
        let session = self
            .session
            .as_ref()
            .ok_or_else(|| JsValue::from_str("no log open"))?;
        let base = base_message_name(message_type);

        let arr = if let Some(inst) = instance {
            session
                .get_instance(base, inst as i64, field)
                .map_err(parse_error)?
        } else {
            session.get(base, field).map_err(parse_error)?
        };

        field_array_to_js(&arr)
    }

    #[wasm_bindgen(js_name = metadata)]
    pub fn metadata(&self) -> Result<JsValue, JsValue> {
        let session = self
            .session
            .as_ref()
            .ok_or_else(|| JsValue::from_str("no log open"))?;
        let meta = session.snapshot().metadata;
        to_js(&LogMetadataJs {
            start_time: meta.start_time.map(|dt| dt.to_rfc3339()),
            file_size: meta.file_size,
            message_type_count: session
                .parser()
                .message_types()
                .iter()
                .filter(|(name, info)| should_list_type(name, info))
                .count(),
        })
    }
}
