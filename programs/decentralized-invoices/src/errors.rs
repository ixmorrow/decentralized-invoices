use anchor_lang::prelude::*;

#[error_code]
pub enum InvoiceError {
    #[msg("Invoice has expired")]
    InvoiceExpired,
    #[msg("Invoice has not expired yet")]
    InvoiceStillValid
}