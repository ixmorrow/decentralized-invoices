use {
    anchor_lang::prelude::*,
    crate::state::*,
    crate::errors::*,
};

pub fn handler(ctx: Context<UpdateInvoice>, ix: UpdateInvoiceIx) -> Result<()> {
    let invoice = &mut ctx.accounts.invoice;

    require!(
        invoice.expired != true,
        InvoiceError::InvoiceExpired
    );

    invoice.customer = ix.customer;
    invoice.currency = ix.currency;
    invoice.amount = ix.amount;

    msg!("Invoice updated: {}", invoice.uuid);

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateInvoice<'info> {
    #[account(mut)]
    pub merchant: Signer<'info>,
    #[account(
        mut,
        seeds = [&invoice.uuid.to_le_bytes(), INVOICE_SEED.as_bytes(), merchant.key().as_ref()],
        bump = invoice.bump
    )]
    pub invoice: Account<'info, Invoice>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateInvoiceIx {
    customer: Option<Pubkey>,
    currency: Option<Pubkey>,
    amount: Option<u64>,
}