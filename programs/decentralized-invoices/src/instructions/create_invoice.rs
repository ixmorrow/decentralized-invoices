use {
    anchor_lang::prelude::*,
    crate::state::*,
    anchor_spl::{
        token::Mint,
    },
};

pub fn handler(ctx: Context<CreateInvoice>, uuid: u64, amount: u64) -> Result<()> {
    let invoice = &mut ctx.accounts.invoice;
    invoice.customer = Some(ctx.accounts.customer.key());
    invoice.merchant = ctx.accounts.merchant.key();
    invoice.currency = Some(ctx.accounts.payment_mint.key());
    invoice.amount = Some(amount);
    invoice.paid = false;
    invoice.expired = false;
    invoice.created = Clock::get().unwrap().unix_timestamp;
    invoice.uuid = uuid;
    invoice.bump = *ctx.bumps.get("invoice").unwrap();

    msg!("Invoice created - uuid: {}", invoice.uuid);
    emit!(CreateInvoiceEvent{
        topic: "Invoice created".to_string(),
        uuid: invoice.uuid
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(uuid: u64)]
pub struct CreateInvoice<'info> {
    #[account(mut)]
    pub merchant: Signer<'info>,
    /// CHECK: not reading data fromt this account
    pub customer: AccountInfo<'info>,
    #[account(
        init,
        payer = merchant,
        space = INVOICE_SIZE,
        seeds = [&uuid.to_le_bytes(), INVOICE_SEED.as_bytes(), merchant.key().as_ref()],
        bump
    )]
    pub invoice: Account<'info, Invoice>,
    pub payment_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>
}