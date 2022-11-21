use {
    anchor_lang::prelude::*,
    crate::state::*,
    anchor_spl::{
        token::{Mint, Token, TokenAccount, Transfer, transfer},
    },
    crate::errors::*,
};

pub fn handler(ctx: Context<PayInvoice>) -> Result<()> {
    require!(
        Clock::get().unwrap().unix_timestamp < ctx.accounts.invoice.created + 172800,
        InvoiceError::InvoiceExpired
    );

    transfer(ctx.accounts.transfer_ctx(), ctx.accounts.invoice.amount)?;

    Ok(())
}

#[derive(Accounts)]
pub struct PayInvoice<'info> {
    #[account(mut)]
    pub invoice: Account<'info, Invoice>,
    #[account(
        mut,
        constraint = customer.key() == invoice.customer
    )]
    pub customer: Signer<'info>,
    /// CHECK: not reading data from this account
    #[account(
        constraint = merchant.key() == invoice.merchant
    )]
    pub merchant: AccountInfo<'info>,
    #[account(
        constraint = customer_token_acct.mint.key() == payment_mint.key()
    )]
    pub customer_token_acct: Account<'info, TokenAccount>,
    #[account(
        associated_token::mint = payment_mint,
        associated_token::authority = merchant
    )]
    pub merchant_token_acct: Account<'info, TokenAccount>,
    #[account(
        constraint = payment_mint.key() == invoice.currency
    )]
    pub payment_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>
}

impl<'info> PayInvoice <'info> {
    pub fn transfer_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.customer.to_account_info(),
            to: self.merchant_token_acct.to_account_info(),
            authority: self.customer.to_account_info()
        };

        CpiContext::new(cpi_program, cpi_accounts)
    }
}