use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;

declare_id!("Vox4Hta7Tank473DCBwbEdYUBqFBWxfntK3WwkdGf3L");

#[program]
pub mod vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>, apy_bps: u64) -> Result<()> {
        let vault_state = &mut ctx.accounts.vault_state;
        vault_state.admin = *ctx.accounts.admin.key;
        vault_state.apy_bps = apy_bps;
        vault_state.total_deposited = 0;
        vault_state.bump = ctx.bumps.vault_state;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let ix = system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.vault_pda.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.vault_pda.to_account_info(),
            ],
        )?;

        let position = &mut ctx.accounts.position;
        if position.amount == 0 {
            position.start_time = Clock::get()?.unix_timestamp;
        } else {
            let yield_amount = calculate_yield(
                position.amount,
                ctx.accounts.vault_state.apy_bps,
                position.start_time,
                Clock::get()?.unix_timestamp,
            )?;
            position.accrued_yield += yield_amount;
            position.start_time = Clock::get()?.unix_timestamp;
        }

        position.amount += amount;
        position.owner = ctx.accounts.user.key();

        ctx.accounts.vault_state.total_deposited += amount;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let position = &mut ctx.accounts.position;
        require!(position.amount >= amount, VaultError::InsufficientFunds);

        let current_time = Clock::get()?.unix_timestamp;
        let yield_amount = calculate_yield(
            position.amount,
            ctx.accounts.vault_state.apy_bps,
            position.start_time,
            current_time,
        )?;
        let total_yield = position.accrued_yield + yield_amount;

        position.amount -= amount;
        position.accrued_yield = 0;
        position.start_time = current_time;

        let total_to_withdraw = amount + total_yield;

        **ctx.accounts.vault_pda.sub_lamports(total_to_withdraw)?;
        **ctx.accounts.user.add_lamports(total_to_withdraw)?;

        ctx.accounts.vault_state.total_deposited -= amount;

        Ok(())
    }
}

pub fn calculate_yield(amount: u64, apy_bps: u64, start_time: i64, end_time: i64) -> Result<u64> {
    let elapsed = (end_time - start_time) as u64;
    if elapsed == 0 {
        return Ok(0);
    }

    let year_seconds: u64 = 31_536_000;
    let yield_amount =
        (amount as u128 * apy_bps as u128 * elapsed as u128) / (10_000 * year_seconds as u128);

    Ok(yield_amount as u64)
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 8 + 8 + 1,
        seeds = [b"vault"],
        bump
    )]
    pub vault_state: Account<'info, VaultState>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"vault"],
        bump = vault_state.bump
    )]
    pub vault_state: Account<'info, VaultState>,
    /// CHECK: This is the PDA holding the SOL
    #[account(
        mut,
        seeds = [b"vault_pda"],
        bump
    )]
    pub vault_pda: AccountInfo<'info>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 32 + 8 + 8 + 8,
        seeds = [b"position", user.key().as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"vault"],
        bump = vault_state.bump
    )]
    pub vault_state: Account<'info, VaultState>,
    /// CHECK: PDA holding the SOL
    #[account(
        mut,
        seeds = [b"vault_pda"],
        bump
    )]
    pub vault_pda: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [b"position", user.key().as_ref()],
        bump,
        has_one = owner
    )]
    pub position: Account<'info, Position>,
    pub owner: Signer<'info>,
    #[account(mut)]
    pub user: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct VaultState {
    pub admin: Pubkey,
    pub apy_bps: u64,
    pub total_deposited: u64,
    pub bump: u8,
}

#[account]
pub struct Position {
    pub owner: Pubkey,
    pub amount: u64,
    pub start_time: i64,
    pub accrued_yield: u64,
}

#[error_code]
pub enum VaultError {
    #[msg("Insufficient funds in vault position")]
    InsufficientFunds,
}
