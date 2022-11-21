use {
    anchor_lang::prelude::*,
    {instructions::*}
};

pub mod instructions;
pub mod state;
pub mod errors;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod decentralized_invoices {
    use super::*;

    pub fn create_invoice(ctx: Context<CreateInvoice>, uuid: u64, amount: u64) -> Result<()> {
        create_invoice::handler(ctx, uuid, amount)
    }

    pub fn pay_invoice(ctx: Context<PayInvoice>) -> Result<()> {
        pay_invoice::handler(ctx)
    }

    pub fn expire_invoice(ctx: Context<ExpireInvoice>) -> Result<()> {
        expire_invoice::handler(ctx)
    }

    pub fn update_invoice(ctx: Context<UpdateInvoice>, ix: UpdateInvoiceIx) -> Result<()> {
        update_invoice::handler(ctx, ix)
    }
}