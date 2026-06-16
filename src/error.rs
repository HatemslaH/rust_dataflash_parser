use std::fmt;

#[derive(Debug)]
pub enum ParseError {
    UnexpectedEof,
    InvalidFormat(String),
    PopulateUnitsFailed(String),
    UnknownMessageType(String),
    FieldParseError {
        message: String,
        field: String,
        offset: usize,
        source: String,
    },
    InvalidFieldType(char),
    UnknownField(String),
    UnknownInstance(i64),
    Io(std::io::Error),
}

impl fmt::Display for ParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ParseError::UnexpectedEof => write!(f, "unexpected end of buffer"),
            ParseError::InvalidFormat(msg) => write!(f, "invalid format: {msg}"),
            ParseError::PopulateUnitsFailed(msg) => write!(f, "populate units failed: {msg}"),
            ParseError::UnknownMessageType(name) => write!(f, "unknown message type: {name}"),
            ParseError::FieldParseError {
                message,
                field,
                offset,
                source,
            } => write!(
                f,
                "field parse error in {message}.{field} at offset {offset}: {source}"
            ),
            ParseError::InvalidFieldType(ch) => write!(f, "invalid field type: '{ch}'"),
            ParseError::UnknownField(field) => write!(f, "unknown field: {field}"),
            ParseError::UnknownInstance(inst) => write!(f, "unknown instance: {inst}"),
            ParseError::Io(err) => write!(f, "io error: {err}"),
        }
    }
}

impl std::error::Error for ParseError {}

impl From<std::io::Error> for ParseError {
    fn from(err: std::io::Error) -> Self {
        ParseError::Io(err)
    }
}

pub type Result<T> = std::result::Result<T, ParseError>;
