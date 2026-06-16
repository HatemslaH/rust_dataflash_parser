use chrono::{DateTime, Datelike, TimeZone, Utc};

use crate::error::{ParseError, Result};
use crate::parser::DataflashParser;
use crate::types::FieldArray;

const GPS_OK_FIX_3D: f64 = 3.0;
const MS_PER_WEEK: f64 = 7.0 * 24.0 * 60.0 * 60.0 * 1000.0;
const UNIX_GPS_OFFSET_MS: f64 = 315964800.0 * 1000.0;

struct GpsTime {
    time_us: f64,
    weeks: f64,
    ms: f64,
}

/// TAI leap seconds lookup matching JsDataflashParser `leapSecondsTAI`.
pub fn leap_seconds_tai(year: i32, month: u32) -> i32 {
    let yyyymm = year * 100 + month as i32;
    if yyyymm >= 201701 {
        return 37;
    }
    if yyyymm >= 201507 {
        return 36;
    }
    if yyyymm >= 201207 {
        return 35;
    }
    if yyyymm >= 200901 {
        return 34;
    }
    if yyyymm >= 200601 {
        return 33;
    }
    if yyyymm >= 199901 {
        return 32;
    }
    if yyyymm >= 199707 {
        return 31;
    }
    if yyyymm >= 199601 {
        return 30;
    }
    0
}

/// GPS leap seconds: TAI offset minus 19.
pub fn leap_seconds_gps(year: i32, month: u32) -> i32 {
    leap_seconds_tai(year, month) - 19
}

fn first_time_us_from_buffer(parser: &DataflashParser) -> Option<u64> {
    let mut first_offset: Option<usize> = None;

    for entry in parser.fmt_entries() {
        let time_index = entry.columns.iter().position(|c| c == "TimeUS");
        let time_index = match time_index {
            Some(i) if entry.format.chars().nth(i) == Some('Q') => i,
            _ => continue,
        };
        let time_us_offset = entry.format_offset[time_index];

        if let Some(instances) = &entry.instances_offset_array {
            for offsets in instances.values() {
                if let Some(&msg_offset) = offsets.first() {
                    let time_offset = msg_offset + time_us_offset;
                    if first_offset.is_none_or(|o| time_offset < o) {
                        first_offset = Some(time_offset);
                    }
                }
            }
        } else if let Some(&msg_offset) = entry.offset_array.first() {
            let time_offset = msg_offset + time_us_offset;
            if first_offset.is_none_or(|o| time_offset < o) {
                first_offset = Some(time_offset);
            }
        }
    }

    first_offset.map(|offset| {
        let mut off = offset;
        parser
            .read_type_at(&mut off, 'Q')
            .ok()
            .and_then(|v| v.as_f64())
            .map(|v| v as u64)
            .unwrap_or(0)
    })
}

fn numeric_at_index(arr: &FieldArray, index: usize) -> Option<f64> {
    match arr {
        FieldArray::Numeric(v) => v.get(index).copied(),
        _ => None,
    }
}

fn get_gps_time(
    time: &FieldArray,
    status: &FieldArray,
    weeks: &FieldArray,
    ms: &FieldArray,
) -> Option<GpsTime> {
    let len = time.len();
    for i in 0..len {
        let status_val = numeric_at_index(status, i)?;
        let weeks_val = numeric_at_index(weeks, i)?;
        let ms_val = numeric_at_index(ms, i)?;
        let time_val = numeric_at_index(time, i)?;
        if status_val >= GPS_OK_FIX_3D && weeks_val > 1000.0 && ms_val > 0.0 {
            return Some(GpsTime {
                time_us: time_val,
                weeks: weeks_val,
                ms: ms_val,
            });
        }
    }
    None
}

fn pick_first_gps_time(parser: &DataflashParser) -> Result<Option<GpsTime>> {
    if !parser.message_types().contains_key("GPS") {
        return Ok(None);
    }

    let mut best: Option<GpsTime> = None;

    let info = parser.message_types().get("GPS");
    if let Some(info) = info {
        if let Some(instances) = &info.instances {
            for inst in instances.keys() {
                let time = get_gps_time(
                    &parser.get_instance("GPS", *inst, "TimeUS")?,
                    &parser.get_instance("GPS", *inst, "Status")?,
                    &parser.get_instance("GPS", *inst, "GWk")?,
                    &parser.get_instance("GPS", *inst, "GMS")?,
                );
                if let Some(t) = time
                    && best.as_ref().is_none_or(|b| t.time_us < b.time_us)
                {
                    best = Some(t);
                }
            }
        } else {
            best = get_gps_time(
                &parser.get("GPS", "TimeUS")?,
                &parser.get("GPS", "Status")?,
                &parser.get("GPS", "GWk")?,
                &parser.get("GPS", "GMS")?,
            );
        }
    }

    Ok(best)
}

/// Extract log start time from GPS messages, matching JsDataflashParser `extractStartTime`.
pub fn extract_start_time(parser: &DataflashParser) -> Result<Option<DateTime<Utc>>> {
    let gps_time = pick_first_gps_time(parser)?;
    let gps_time = match gps_time {
        Some(t) => t,
        None => return Ok(None),
    };

    let start_time_us = first_time_us_from_buffer(parser);

    let gps_ms = gps_time.weeks * MS_PER_WEEK + gps_time.ms;
    let log_start_offset_ms = if let Some(start_us) = start_time_us {
        (gps_time.time_us - start_us as f64) * 0.001
    } else {
        0.0
    };

    let unix_ms = UNIX_GPS_OFFSET_MS + gps_ms - log_start_offset_ms;
    let unix_ms_i64 = unix_ms.round() as i64;

    let secs = unix_ms_i64 / 1000;
    let nanos = ((unix_ms_i64 % 1000) * 1_000_000) as u32;
    let dt = Utc
        .timestamp_opt(secs, nanos)
        .single()
        .ok_or_else(|| ParseError::InvalidFormat("invalid unix timestamp".into()))?;

    let leap = leap_seconds_gps(dt.year(), dt.month());
    let adjusted = dt - chrono::Duration::seconds(leap as i64);

    Ok(Some(adjusted))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn leap_seconds_tai_matches_js() {
        assert_eq!(leap_seconds_tai(2020, 1), 37);
        assert_eq!(leap_seconds_tai(2015, 7), 36);
        assert_eq!(leap_seconds_tai(1995, 12), 0);
    }

    #[test]
    fn leap_seconds_gps_is_tai_minus_19() {
        assert_eq!(leap_seconds_gps(2020, 1), 18);
    }
}
