use rust_dataflash_parser::{DEFAULT_MESSAGES, LogSession, Parallelism};

#[test]
fn minimal_fixture_indexes_and_loads() {
    let data = std::fs::read("tests/fixtures/minimal.bin").expect("minimal.bin fixture");
    let mut session = LogSession::from_bytes(data);
    session.index().expect("index");
    let types = session.available_message_types();
    assert!(types.iter().any(|t| t == "TST"));

    session.load_message_type("TST").expect("load TST");
    let result = session.snapshot();
    assert_eq!(result.stats.message_count, 1);
    let tst = result.messages.get("TST").expect("TST messages");
    let time = tst.get("time_boot_ms").expect("time_boot_ms");
    assert_eq!(time.len(), 3);
}

#[test]
fn default_messages_parse_on_minimal_fixture() {
    let data = std::fs::read("tests/fixtures/minimal.bin").expect("minimal.bin fixture");
    let mut session = LogSession::from_bytes(data);
    session.index().expect("index");
    let names: Vec<String> = DEFAULT_MESSAGES
        .iter()
        .map(|s| s.to_string())
        .chain(["TST".to_string()])
        .collect();
    session
        .load_messages(&names, Parallelism::Sequential)
        .expect("load default messages");
    let result = session.snapshot();
    assert!(result.stats.message_count >= 1);
}
