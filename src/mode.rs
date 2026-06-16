use std::collections::HashMap;

const MAV_TYPE_FIXED_WING: i32 = 1;
const MAV_TYPE_QUADROTOR: i32 = 2;
const MAV_TYPE_ANTENNA_TRACKER: i32 = 5;
const MAV_TYPE_GROUND_ROVER: i32 = 10;
const MAV_TYPE_SUBMARINE: i32 = 12;

fn mode_mapping_acm() -> HashMap<i32, &'static str> {
    HashMap::from([
        (0, "STABILIZE"),
        (1, "ACRO"),
        (2, "ALT_HOLD"),
        (3, "AUTO"),
        (4, "GUIDED"),
        (5, "LOITER"),
        (6, "RTL"),
        (7, "CIRCLE"),
        (9, "LAND"),
        (11, "DRIFT"),
        (13, "SPORT"),
        (14, "FLIP"),
        (15, "AUTOTUNE"),
        (16, "POSHOLD"),
        (17, "BRAKE"),
        (18, "THROW"),
        (19, "AVOID_ADSB"),
        (20, "GUIDED_NOGPS"),
        (21, "SMART_RTL"),
        (22, "FLOWHOLD"),
        (23, "FOLLOW"),
        (24, "ZIGZAG"),
        (25, "SYSTEMID"),
        (26, "AUTOROTATE"),
    ])
}

fn mode_mapping_apm() -> HashMap<i32, &'static str> {
    HashMap::from([
        (0, "MANUAL"),
        (1, "CIRCLE"),
        (2, "STABILIZE"),
        (3, "TRAINING"),
        (4, "ACRO"),
        (5, "FBWA"),
        (6, "FBWB"),
        (7, "CRUISE"),
        (8, "AUTOTUNE"),
        (10, "AUTO"),
        (11, "RTL"),
        (12, "LOITER"),
        (13, "TAKEOFF"),
        (14, "AVOID_ADSB"),
        (15, "GUIDED"),
        (16, "INITIALISING"),
        (17, "QSTABILIZE"),
        (18, "QHOVER"),
        (19, "QLOITER"),
        (20, "QLAND"),
        (21, "QRTL"),
        (22, "QAUTOTUNE"),
        (23, "QACRO"),
        (24, "THERMAL"),
    ])
}

fn mode_mapping_rover() -> HashMap<i32, &'static str> {
    HashMap::from([
        (0, "MANUAL"),
        (1, "ACRO"),
        (3, "STEERING"),
        (4, "HOLD"),
        (5, "LOITER"),
        (6, "FOLLOW"),
        (7, "SIMPLE"),
        (8, "DOCK"),
        (9, "CIRCLE"),
        (10, "AUTO"),
        (11, "RTL"),
        (12, "SMART_RTL"),
        (15, "GUIDED"),
        (16, "INITIALISING"),
    ])
}

fn mode_mapping_tracker() -> HashMap<i32, &'static str> {
    HashMap::from([
        (0, "MANUAL"),
        (1, "STOP"),
        (2, "SCAN"),
        (3, "SERVO_TEST"),
        (10, "AUTO"),
        (16, "INITIALISING"),
    ])
}

fn mode_mapping_sub() -> HashMap<i32, &'static str> {
    HashMap::from([
        (0, "STABILIZE"),
        (1, "ACRO"),
        (2, "ALT_HOLD"),
        (3, "AUTO"),
        (4, "GUIDED"),
        (7, "CIRCLE"),
        (9, "SURFACE"),
        (16, "POSHOLD"),
        (19, "MANUAL"),
        (20, "MOTOR_DETECT"),
    ])
}

fn get_mode_map(mav_type: i32) -> Option<HashMap<i32, &'static str>> {
    match mav_type {
        MAV_TYPE_FIXED_WING => Some(mode_mapping_apm()),
        MAV_TYPE_QUADROTOR => Some(mode_mapping_acm()),
        MAV_TYPE_GROUND_ROVER => Some(mode_mapping_rover()),
        MAV_TYPE_ANTENNA_TRACKER => Some(mode_mapping_tracker()),
        MAV_TYPE_SUBMARINE => Some(mode_mapping_sub()),
        _ => None,
    }
}

pub fn get_mode_string(cmode: f64, msg_messages: Option<&[String]>) -> String {
    let cmode = cmode as i32;
    let mav_type = if let Some(messages) = msg_messages {
        let lower: Vec<String> = messages.iter().map(|m| m.to_lowercase()).collect();
        if lower.iter().any(|m| m.contains("arduplane")) {
            MAV_TYPE_FIXED_WING
        } else if lower.iter().any(|m| m.contains("arducopter")) {
            MAV_TYPE_QUADROTOR
        } else if lower.iter().any(|m| m.contains("ardusub")) {
            MAV_TYPE_SUBMARINE
        } else if lower.iter().any(|m| m.contains("rover")) {
            MAV_TYPE_GROUND_ROVER
        } else if lower.iter().any(|m| m.contains("tracker")) {
            MAV_TYPE_ANTENNA_TRACKER
        } else {
            MAV_TYPE_QUADROTOR
        }
    } else {
        MAV_TYPE_QUADROTOR
    };

    get_mode_map(mav_type)
        .and_then(|map| map.get(&cmode).copied())
        .unwrap_or("UNKNOWN")
        .to_string()
}

pub fn multiplier_for_id(id: char) -> f64 {
    match id {
        '-' => 0.0,
        '?' => 1.0,
        '2' => 1e2,
        '1' => 1e1,
        '0' => 1e0,
        'A' => 1e-1,
        'B' => 1e-2,
        'C' => 1e-3,
        'D' => 1e-4,
        'E' => 1e-5,
        'F' => 1e-6,
        'G' => 1e-7,
        '!' => 3.6,
        '/' => 3600.0,
        _ => 1.0,
    }
}

pub fn unit_for_id(id: char) -> &'static str {
    match id {
        '-' => "",
        '?' => "UNKNOWN",
        'A' => "A",
        'd' => "°",
        'b' => "B",
        'k' => "°/s",
        'D' => "°",
        'e' => "°/s/s",
        'E' => "rad/s",
        'G' => "Gauss",
        'h' => "°",
        'i' => "A.s",
        'J' => "W.s",
        'L' => "rad/s/s",
        'm' => "m",
        'n' => "m/s",
        'o' => "m/s/s",
        'O' => "°C",
        '%' => "%",
        'S' => "satellites",
        's' => "s",
        'q' => "rpm",
        'r' => "rad",
        'U' => "°",
        'u' => "ppm",
        'v' => "V",
        'P' => "Pa",
        'w' => "Ohm",
        'Y' => "us",
        'z' => "Hz",
        '#' => "instance",
        _ => "?",
    }
}

pub fn multiplier_table_display(mult: f64) -> &'static str {
    if (mult - 0.000001).abs() < f64::EPSILON {
        "n"
    } else if (mult - 1000.0).abs() < f64::EPSILON {
        "M"
    } else if (mult - 0.001).abs() < f64::EPSILON {
        "m"
    } else {
        ""
    }
}
