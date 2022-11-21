use {
    anchor_lang::prelude::*,
    crate::state::*,
    crate::errors::*,
};

pub fn handler(ctx: Context<ExpireInvoice>) -> Result<()> {
    let invoice = &mut ctx.accounts.invoice;

    // for testing purposes, expiring invoices before 48 hrs
    // require!(
    //     Clock::get().unwrap().unix_timestamp > invoice.created + 172800,
    //     InvoiceError::InvoiceStillValid
    // );
    msg!("Current timestamp: {}", Clock::get().unwrap().unix_timestamp);
    msg!("Invoice created: {}", invoice.created);
    require!(
        Clock::get().unwrap().unix_timestamp > invoice.created,
        InvoiceError::InvoiceStillValid
    );

    invoice.expired = true;

    msg!("Invoice expired: {}", invoice.uuid);

    Ok(())
}

#[derive(Accounts)]
pub struct ExpireInvoice<'info> {
    #[account(mut)]
    pub merchant: Signer<'info>,
    #[account(
        mut,
        seeds = [&invoice.uuid.to_le_bytes(), INVOICE_SEED.as_bytes(), merchant.key().as_ref()],
        bump = invoice.bump
    )]
    pub invoice: Account<'info, Invoice>,
}