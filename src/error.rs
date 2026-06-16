use std::fmt;

/// Error returned by parsing and session operations.
#[derive(Debug)]
pub enum ParseError {
    /// Reached end of buffer while reading a field.
    UnexpectedEof,
    /// Invalid or incomplete FMT / message structure.
    InvalidFormat(String),
    /// FMTU unit population failed.
    PopulateUnitsFailed(String),
    /// Message type name not found in the FMT table.
    UnknownMessageType(String),
    /// A single field failed to decode at a message offset.
    FieldParseError {
        /// Message type name, e.g. `GPS`.
        message: String,
        /// Column name, e.g. `Status`.
        field: String,
        /// Byte offset of the message in the log.
        offset: usize,
        /// Underlying decode error description.
        source: String,
    },
    /// Unknown character in a FMT format string.
    InvalidFieldType(char),
    /// Column name not present in the message definition.
    UnknownField(String),
    /// Instance id not found for an instanced message.
    UnknownInstance(i64),
    /// File I/O error (e.g. when opening a log with [`crate::LogSession::open`]).
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

/// Crate-wide result type alias.
pub type Result<T> = std::result::Result<T, ParseError>;
