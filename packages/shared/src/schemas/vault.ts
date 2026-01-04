import { z } from 'zod';

export const VaultConfigSchema = z.object({
  apyBps: z.number(),
  minDeposit: z.string(),
  maxDeposit: z.string(),
});

export type VaultConfig = z.infer<typeof VaultConfigSchema>;

export const VaultPositionSchema = z.object({
  owner: z.string(),
  depositedAmount: z.string(),
  shares: z.string(),
  depositTimestamp: z.number(),
  accruedYield: z.string(),
});

export type VaultPosition = z.infer<typeof VaultPositionSchema>;

export const DEFAULT_VAULT_CONFIG: VaultConfig = {
  apyBps: 500,
  minDeposit: '10000000',
  maxDeposit: '100000000000',
};
