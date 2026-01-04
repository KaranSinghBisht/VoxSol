import { z } from 'zod';

export const PaymentRequirementsSchema = z.object({
  paymentId: z.string(),
  amount: z.string(),
  tokenMint: z.string(),
  recipient: z.string(),
  network: z.enum(['devnet', 'mainnet-beta']),
  expiresAt: z.number(),
  tool: z.string(),
});

export type PaymentRequirements = z.infer<typeof PaymentRequirementsSchema>;

export const PaymentProofSchema = z.object({
  paymentId: z.string(),
  signature: z.string(),
  payer: z.string(),
});

export type PaymentProof = z.infer<typeof PaymentProofSchema>;

export const PaymentReceiptSchema = z.object({
  paymentId: z.string(),
  amount: z.string(),
  tokenMint: z.string(),
  timestamp: z.number(),
  tool: z.string(),
  signature: z.string(),
});

export type PaymentReceipt = z.infer<typeof PaymentReceiptSchema>;

export const TOOL_PRICING: Record<string, string> = {
  'yield_agent.run': '0.001',
  'swap_agent.optimized': '0.001',
  'tx_explain.deep': '0.001',
};

export const X402_HEADERS = {
  PAYMENT_REQUIRED: 'X-Payment-Required',
  PAYMENT: 'X-Payment',
  PAYMENT_RESPONSE: 'X-Payment-Response',
} as const;
