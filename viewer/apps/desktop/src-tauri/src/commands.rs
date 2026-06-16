use rust_dataflash_parser::LogSession;
use serde::Serialize;
use std::collections::HashMap;
use tauri::{State, AppHandle, Emitter};

use crate::state::AppState;
use rust_dataflash_parser::MessageStats;

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ParseProgress {
    pub phase: String,
    pub percent: f64,
    pub message: String,
}

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

#[tauri::command]
pub async fn open_log(
    path: String,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<LogSummary, String> {
    let _ = app.emit("parse_progress", ParseProgress {
        phase: "indexing".to_string(),
        percent: 10.0,
        message: "Opening file...".to_string(),
    });

    let mut session = LogSession::open(&path).map_err(|e| e.to_string())?;

    let _ = app.emit("parse_progress", ParseProgress {
        phase: "indexing".to_string(),
        percent: 50.0,
        message: "Indexing log...".to_string(),
    });

    session.index().map_err(|e| e.to_string())?;

    let _ = app.emit("parse_progress", ParseProgress {
        phase: "ready".to_string(),
        percent: 100.0,
        message: "Ready".to_string(),
    });

    let file_name = std::path::Path::new(&path)
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or(&path)
        .to_string();

    let summary = build_summary(&file_name, &session)?;
    *state.session.lock().map_err(|e| e.to_string())? = Some(session);
    Ok(summary)
}

#[tauri::command]
pub async fn open_bytes(
    data: Vec<u8>,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<LogSummary, String> {
    let _ = app.emit("parse_progress", ParseProgress {
        phase: "indexing".to_string(),
        percent: 10.0,
        message: "Loading bytes...".to_string(),
    });

    let mut session = LogSession::from_bytes(data);

    let _ = app.emit("parse_progress", ParseProgress {
        phase: "indexing".to_string(),
        percent: 50.0,
        message: "Indexing log...".to_string(),
    });

    session.index().map_err(|e| e.to_string())?;

    let _ = app.emit("parse_progress", ParseProgress {
        phase: "ready".to_string(),
        percent: 100.0,
        message: "Ready".to_string(),
    });

    let summary = build_summary("uploaded.bin", &session)?;
    *state.session.lock().map_err(|e| e.to_string())? = Some(session);
    Ok(summary)
}

#[tauri::command]
pub fn close_log(state: State<'_, AppState>) -> Result<(), String> {
    *state.session.lock().map_err(|e| e.to_string())? = None;
    Ok(())
}

#[tauri::command]
pub fn list_message_types(state: State<'_, AppState>) -> Result<Vec<MessageTypeEntry>, String> {
    let guard = state.session.lock().map_err(|e| e.to_string())?;
    let session = guard.as_ref().ok_or_else(|| "No log open".to_string())?;
    let parser = session.parser();
    let stats = parser.stats();
    let loaded = parser.messages();
    let schema = parser.message_types();

    let types = session
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

    Ok(types)
}

#[tauri::command]
pub async fn load_message_types(
    names: Vec<String>,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<(), String> {
    let mut guard = state.session.lock().map_err(|e| e.to_string())?;
    let session = guard.as_mut().ok_or_else(|| "No log open".to_string())?;

    let total = names.len();
    for (i, name) in names.iter().enumerate() {
        let percent = (i as f64 / total as f64) * 100.0;
        let _ = app.emit("parse_progress", ParseProgress {
            phase: "loading".to_string(),
            percent,
            message: format!("Loading {}...", name),
        });

        session
            .load_message_type(name)
            .map_err(|e| e.to_string())?;
    }

    let _ = app.emit("parse_progress", ParseProgress {
        phase: "ready".to_string(),
        percent: 100.0,
        message: "Ready".to_string(),
    });

    Ok(())
}

#[tauri::command]
pub fn get_field_series(
    type_name: String,
    field: String,
    instance: Option<i64>,
    state: State<'_, AppState>,
) -> Result<FieldSeries, String> {
    let guard = state.session.lock().map_err(|e| e.to_string())?;
    let session = guard.as_ref().ok_or_else(|| "No log open".to_string())?;

    let array = if let Some(id) = instance {
        session
            .get_instance(&type_name, id, &field)
            .map_err(|e| e.to_string())?
    } else {
        session.get(&type_name, &field).map_err(|e| e.to_string())?
    };

    Ok(field_array_to_series(array))
}

#[tauri::command]
pub fn get_metadata(state: State<'_, AppState>) -> Result<LogMetadata, String> {
    let guard = state.session.lock().map_err(|e| e.to_string())?;
    let session = guard.as_ref().ok_or_else(|| "No log open".to_string())?;
    let snapshot = session.snapshot();

    Ok(LogMetadata {
        start_time: snapshot.metadata.start_time.map(|t| t.to_rfc3339()),
        file_size: snapshot.metadata.file_size,
        message_type_count: snapshot.metadata.message_type_count,
    })
}

fn build_summary(file_name: &str, session: &LogSession) -> Result<LogSummary, String> {
    let snapshot = session.snapshot();
    let available_types = session.available_message_types();
    let fmt_stats = stats_to_json(session.parser().stats());

    Ok(LogSummary {
        file_name: file_name.to_string(),
        file_size: snapshot.metadata.file_size,
        message_type_count: snapshot.metadata.message_type_count,
        available_types,
        fmt_stats,
        start_time: snapshot.metadata.start_time.map(|t| t.to_rfc3339()),
    })
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

fn field_array_to_series(array: rust_dataflash_parser::FieldArray) -> FieldSeries {
    use rust_dataflash_parser::FieldArray;

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
