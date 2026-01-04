import { Context } from 'hono';
import type { Env } from './index';

type QuoteRequest = {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
};

type SwapRequest = {
  quoteResponse: unknown;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
  dynamicComputeUnitLimit?: boolean;
  prioritizationFeeLamports?: 'auto' | number | string;
  asLegacyTransaction?: boolean;
};

function getJupiterBaseUrl(env: Env) {
  const base = env.JUPITER_BASE_URL?.trim();
  return base && base.length > 0 ? base : 'https://api.jup.ag/swap/v1';
}

function getJupiterHeaders(env: Env) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const apiKey = env.JUPITER_API_KEY?.trim();
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }
  return headers;
}

export async function jupiterQuoteHandler(c: Context<{ Bindings: Env }>) {
  const body = (await c.req.json().catch(() => null)) as QuoteRequest | null;
  if (!body?.inputMint || !body.outputMint || !body.amount) {
    return c.json({ error: 'Invalid quote request' }, 400);
  }

  const baseUrl = getJupiterBaseUrl(c.env);
  const url = new URL(baseUrl.replace(/\/$/, '') + '/quote');
  url.searchParams.set('inputMint', body.inputMint);
  url.searchParams.set('outputMint', body.outputMint);
  url.searchParams.set('amount', body.amount);
  url.searchParams.set('slippageBps', String(body.slippageBps ?? 50));

  const resp = await fetch(url.toString(), {
    method: 'GET',
    headers: getJupiterHeaders(c.env),
  });

  const text = await resp.text();
  if (!resp.ok) {
    return c.json({ error: 'Jupiter quote failed', details: text }, 502);
  }

  return new Response(text, { headers: { 'Content-Type': 'application/json' } });
}

export async function jupiterSwapHandler(c: Context<{ Bindings: Env }>) {
  const body = (await c.req.json().catch(() => null)) as SwapRequest | null;
  if (!body?.quoteResponse || !body.userPublicKey) {
    return c.json({ error: 'Invalid swap request' }, 400);
  }

  const baseUrl = getJupiterBaseUrl(c.env);
  const url = baseUrl.replace(/\/$/, '') + '/swap';

  const resp = await fetch(url, {
    method: 'POST',
    headers: getJupiterHeaders(c.env),
    body: JSON.stringify({
      quoteResponse: body.quoteResponse,
      userPublicKey: body.userPublicKey,
      wrapAndUnwrapSol: body.wrapAndUnwrapSol ?? true,
      dynamicComputeUnitLimit: body.dynamicComputeUnitLimit ?? true,
      prioritizationFeeLamports: body.prioritizationFeeLamports ?? 'auto',
      asLegacyTransaction: body.asLegacyTransaction ?? false,
    }),
  });

  const text = await resp.text();
  if (!resp.ok) {
    return c.json({ error: 'Jupiter swap failed', details: text }, 502);
  }

  return new Response(text, { headers: { 'Content-Type': 'application/json' } });
}
