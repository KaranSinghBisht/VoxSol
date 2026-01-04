import { z } from 'zod';

export const IntentSchema = z.enum([
  'BALANCES',
  'RECENT_TX',
  'SWAP',
  'VAULT_DEPOSIT',
  'VAULT_WITHDRAW',
  'TX_EXPLAIN',
  'UNKNOWN',
]);

export type Intent = z.infer<typeof IntentSchema>;

export const SwapParamsSchema = z.object({
  inputMint: z.string(),
  outputMint: z.string(),
  amount: z.string(),
  slippageBps: z.number().optional().default(50),
});

export const VaultParamsSchema = z.object({
  amount: z.string(),
  action: z.enum(['deposit', 'withdraw']),
});

export const TransferParamsSchema = z.object({
  recipient: z.string(),
  amount: z.string(),
  mint: z.string().optional(),
});

export const ActionProposalSchema = z.object({
  type: z.enum(['SWAP', 'TRANSFER', 'VAULT_DEPOSIT', 'VAULT_WITHDRAW']),
  summary: z.string(),
  params: z.union([SwapParamsSchema, VaultParamsSchema, TransferParamsSchema]),
  riskNotes: z.array(z.string()).optional(),
  cta: z.object({
    label: z.string(),
  }),
});

export type ActionProposal = z.infer<typeof ActionProposalSchema>;

export const PaymentInfoSchema = z.object({
  required: z.boolean(),
  priceUsdc: z.string().optional(),
  tool: z.string().optional(),
});

export const AgentRequestSchema = z.object({
  walletPubkey: z.string(),
  message: z.string(),
  mode: z.enum(['chat', 'tool']).default('chat'),
  context: z
    .object({
      balances: z.record(z.string()).optional(),
      recentTx: z.array(z.string()).optional(),
      selectedToken: z.string().optional(),
    })
    .optional(),
  sessionId: z.string().optional(),
});

export type AgentRequest = z.infer<typeof AgentRequestSchema>;

export const AgentResponseSchema = z.object({
  assistantText: z.string(),
  intent: IntentSchema,
  actionProposals: z.array(ActionProposalSchema).optional(),
  clarifyingQuestion: z.string().optional(),
  toolResult: z.any().optional(),
  payment: PaymentInfoSchema.optional(),
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;

export const TOKEN_MINTS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC_DEVNET: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
  USDC_MAINNET: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
} as const;

export const DEVNET_RPC = 'https://api.devnet.solana.com';
