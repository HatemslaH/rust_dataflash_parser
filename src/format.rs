use crate::error::{ParseError, Result};
use crate::types::FieldArray;

pub fn get_size_of(type_char: char) -> Option<usize> {
    match type_char {
        'b' | 'B' | 'M' => Some(1),
        'h' | 'H' | 'c' | 'C' => Some(2),
        'i' | 'I' | 'f' | 'n' | 'E' | 'e' | 'L' => Some(4),
        'd' | 'Q' | 'q' => Some(8),
        'N' => Some(16),
        'a' | 'Z' => Some(64),
        _ => None,
    }
}

pub fn is_numeric_array_type(type_char: char) -> bool {
    matches!(
        type_char,
        'b' | 'B'
            | 'M'
            | 'h'
            | 'H'
            | 'i'
            | 'L'
            | 'I'
            | 'f'
            | 'd'
            | 'Q'
            | 'q'
            | 'c'
            | 'C'
            | 'E'
            | 'e'
    )
}

pub fn is_string_array_type(type_char: char) -> bool {
    matches!(type_char, 'n' | 'N' | 'Z')
}

pub fn new_field_array(type_char: char, len: usize) -> FieldArray {
    if is_numeric_array_type(type_char) {
        FieldArray::Numeric(vec![0.0; len])
    } else if is_string_array_type(type_char) {
        FieldArray::Text(vec![String::new(); len])
    } else {
        FieldArray::Int16x32(vec![[0i16; 32]; len])
    }
}

fn read_u8(data: &[u8], offset: &mut usize) -> Result<u8> {
    let v = *data.get(*offset).ok_or(ParseError::UnexpectedEof)?;
    *offset += 1;
    Ok(v)
}

fn read_i8(data: &[u8], offset: &mut usize) -> Result<i8> {
    Ok(read_u8(data, offset)? as i8)
}

fn read_u16_le(data: &[u8], offset: &mut usize) -> Result<u16> {
    let bytes = data
        .get(*offset..*offset + 2)
        .ok_or(ParseError::UnexpectedEof)?;
    *offset += 2;
    Ok(u16::from_le_bytes([bytes[0], bytes[1]]))
}

fn read_i16_le(data: &[u8], offset: &mut usize) -> Result<i16> {
    Ok(read_u16_le(data, offset)? as i16)
}

fn read_u32_le(data: &[u8], offset: &mut usize) -> Result<u32> {
    let bytes = data
        .get(*offset..*offset + 4)
        .ok_or(ParseError::UnexpectedEof)?;
    *offset += 4;
    Ok(u32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]))
}

fn read_i32_le(data: &[u8], offset: &mut usize) -> Result<i32> {
    Ok(read_u32_le(data, offset)? as i32)
}

fn read_f32_le(data: &[u8], offset: &mut usize) -> Result<f32> {
    Ok(f32::from_bits(read_u32_le(data, offset)?))
}

fn read_f64_le(data: &[u8], offset: &mut usize) -> Result<f64> {
    let bytes = data
        .get(*offset..*offset + 8)
        .ok_or(ParseError::UnexpectedEof)?;
    *offset += 8;
    Ok(f64::from_le_bytes([
        bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5], bytes[6], bytes[7],
    ]))
}

fn read_u64_as_f64(data: &[u8], offset: &mut usize) -> Result<f64> {
    let low = read_u32_le(data, offset)?;
    let high = read_u32_le(data, offset)?;
    let mut value = f64::from(high) * 4294967296.0 + f64::from(low);
    if low > i32::MAX as u32 {
        value += 4294967296.0;
    }
    Ok(value)
}

fn read_i64_as_f64(data: &[u8], offset: &mut usize) -> Result<f64> {
    let low = read_i32_le(data, offset)?;
    let high = read_i32_le(data, offset)?;
    let mut value = f64::from(high) * 4294967296.0 + f64::from(low);
    if low < 0 {
        value += 4294967296.0;
    }
    Ok(value)
}

fn read_cstring(data: &[u8], offset: &mut usize, len: usize) -> Result<String> {
    let bytes = data
        .get(*offset..*offset + len)
        .ok_or(ParseError::UnexpectedEof)?;
    *offset += len;
    let end = bytes.iter().position(|&b| b == 0).unwrap_or(len);
    Ok(String::from_utf8_lossy(&bytes[..end]).into_owned())
}

/// Parse one field value at `offset`, matching JsDataflashParser `parse_type`.
pub fn parse_type_at(data: &[u8], offset: &mut usize, type_char: char) -> Result<ParsedValue> {
    let value = match type_char {
        'a' => {
            let mut arr = [0i16; 32];
            for item in &mut arr {
                *item = read_i16_le(data, offset)?;
            }
            ParsedValue::I16Array(arr)
        }
        'b' => ParsedValue::F64(f64::from(read_i8(data, offset)?)),
        'B' | 'M' => ParsedValue::F64(f64::from(read_u8(data, offset)?)),
        'h' => ParsedValue::F64(f64::from(read_i16_le(data, offset)?)),
        'H' => ParsedValue::F64(f64::from(read_u16_le(data, offset)?)),
        'i' | 'L' => ParsedValue::F64(f64::from(read_i32_le(data, offset)?)),
        'I' => ParsedValue::F64(f64::from(read_u32_le(data, offset)?)),
        'f' => ParsedValue::F64(f64::from(read_f32_le(data, offset)?)),
        'd' => ParsedValue::F64(read_f64_le(data, offset)?),
        'Q' => ParsedValue::F64(read_u64_as_f64(data, offset)?),
        'q' => ParsedValue::F64(read_i64_as_f64(data, offset)?),
        'n' => ParsedValue::Text(read_cstring(data, offset, 4)?),
        'N' => ParsedValue::Text(read_cstring(data, offset, 16)?),
        'Z' => ParsedValue::Text(read_cstring(data, offset, 64)?),
        'c' => ParsedValue::F64(f64::from(read_i16_le(data, offset)?) / 100.0),
        'C' => ParsedValue::F64(f64::from(read_u16_le(data, offset)?) / 100.0),
        'E' => ParsedValue::F64(f64::from(read_u32_le(data, offset)?) / 100.0),
        'e' => ParsedValue::F64(f64::from(read_i32_le(data, offset)?) / 100.0),
        other => return Err(ParseError::InvalidFieldType(other)),
    };
    Ok(value)
}

#[derive(Debug, Clone)]
pub enum ParsedValue {
    F64(f64),
    Text(String),
    I16Array([i16; 32]),
}

impl ParsedValue {
    pub fn as_f64(&self) -> Option<f64> {
        match self {
            ParsedValue::F64(v) => Some(*v),
            _ => None,
        }
    }

    pub fn as_text(&self) -> Option<&str> {
        match self {
            ParsedValue::Text(v) => Some(v),
            _ => None,
        }
    }
}

pub fn store_parsed_value(array: &mut FieldArray, index: usize, value: ParsedValue) {
    match (array, value) {
        (FieldArray::Numeric(values), ParsedValue::F64(v)) => values[index] = v,
        (FieldArray::Text(values), ParsedValue::Text(v)) => values[index] = v,
        (FieldArray::Int16x32(values), ParsedValue::I16Array(v)) => values[index] = v,
        _ => {}
    }
}

pub fn compute_format_offsets(format: &str) -> (Vec<usize>, usize) {
    let mut format_offset = Vec::with_capacity(format.len());
    let mut size = 0usize;
    for ch in format.chars() {
        format_offset.push(size);
        size += get_size_of(ch).unwrap_or(0);
    }
    (format_offset, size)
}

#[cfg(test)]
mod proptests {
    use super::*;
    use proptest::prelude::*;

    proptest! {
        #[test]
        fn get_size_of_and_parse_never_panic(ch in prop::sample::select(vec!['b','B','h','H','i','I','f','d','Q','q','n','N','Z','c','C','E','e','M','L','a'])) {
            let size = get_size_of(ch);
            if let Some(sz) = size {
                let data = vec![0u8; sz + 4];
                let mut offset = 0usize;
                let _ = parse_type_at(&data, &mut offset, ch);
            }
        }
    }
}
