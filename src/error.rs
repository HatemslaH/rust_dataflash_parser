use std::fmt;

#[derive(Debug)]
pub enum ParseError {
    UnexpectedEof,
    InvalidFormat(String),
}

impl fmt::Display for ParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ParseError::UnexpectedEof => write!(f, "unexpected end of buffer"),
            ParseError::InvalidFormat(msg) => write!(f, "invalid format: {msg}"),
        }
    }
}

impl std::error::Error for ParseError {}

pub type Result<T> = std::result::Result<T, ParseError>;
