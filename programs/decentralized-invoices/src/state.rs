use {
    anchor_lang::prelude::*,
};

pub const INVOICE_SIZE: usize = 8 + std::mem::size_of::<Invoice>() + 8;
pub const INVOICE_SEED: &str = "invoice";

#[account]
pub struct Invoice {
    pub uuid: u64,
    pub customer: Option<Pubkey>,
    pub merchant: Pubkey,
    pub currency: Option<Pubkey>,
    pub amount: Option<u64>,
    pub paid: bool,
    pub expired: bool,
    pub created: i64,
    pub bump: u8
}
