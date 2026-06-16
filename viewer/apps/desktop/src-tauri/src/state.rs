use std::sync::Mutex;

use rust_dataflash_parser::LogSession;

#[derive(Default)]
pub struct AppState {
    pub session: Mutex<Option<LogSession>>,
}
