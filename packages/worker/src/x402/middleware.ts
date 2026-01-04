import { Context, Next } from 'hono';
import {
  TOOL_PRICING,
  X402_HEADERS,
  PaymentRequirementsSchema,
  PaymentProofSchema,
  type PaymentRequirements,
} from '@voxsol/shared';
import type { Env } from '../index';
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

export async function x402Middleware(c: Context<{ Bindings: Env }>, next: Next) {
  const toolName = c.req.param('toolName');
  const price = TOOL_PRICING[toolName];

  if (!price) {
    return next();
  }

  const paymentHeader = c.req.header(X402_HEADERS.PAYMENT);

  if (!paymentHeader) {
    const requirements: PaymentRequirements = {
      paymentId: crypto.randomUUID(),
      amount: price,
      tokenMint: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
      recipient: c.env.MERCHANT_WALLET || 'MERCHANT_WALLET_NOT_SET',
      network: 'devnet',
      expiresAt: Date.now() + 60000,
      tool: toolName,
    };

    c.header(X402_HEADERS.PAYMENT_REQUIRED, JSON.stringify(requirements));
    return c.json({ error: 'Payment required', requirements }, 402);
  }

  try {
    const proof = PaymentProofSchema.parse(JSON.parse(paymentHeader));
    const isValid = await verifyPayment(proof, c.env);

    if (!isValid) {
      return c.json({ error: 'Invalid payment proof' }, 402);
    }

    c.header(
      X402_HEADERS.PAYMENT_RESPONSE,
      JSON.stringify({
        paymentId: proof.paymentId,
        status: 'settled',
        timestamp: Date.now(),
      })
    );

    return next();
  } catch (error) {
    console.error('Payment verification error:', error);
    return c.json({ error: 'Payment verification failed' }, 402);
  }
}

async function verifyPayment(
  proof: { paymentId: string; signature: string; payer: string },
  env: Env
): Promise<boolean> {
  try {
    new PublicKey(proof.payer);
    bs58.decode(proof.signature);
    return true;
  } catch (e) {
    return false;
  }
}
