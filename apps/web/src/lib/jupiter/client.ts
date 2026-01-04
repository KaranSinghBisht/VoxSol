export interface JupiterQuoteRequest {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps: number;
}

export interface JupiterQuoteResponse {
  outAmount: string;
  priceImpactPct?: string;
  otherAmountThreshold?: string;
  routePlan?: unknown;
}

export interface JupiterSwapResponse {
  swapTransaction: string;
}

function getJupiterBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_JUPITER_API_BASE_URL ?? 'http://localhost:8080').replace(
    /\/$/,
    ''
  );
}

function getJupiterApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_JUPITER_API_KEY;
}

export async function getJupiterQuote(req: JupiterQuoteRequest): Promise<JupiterQuoteResponse> {
  const baseUrl = getJupiterBaseUrl();
  const url = new URL(baseUrl + '/quote');
  url.searchParams.set('inputMint', req.inputMint);
  url.searchParams.set('outputMint', req.outputMint);
  url.searchParams.set('amount', req.amount);
  url.searchParams.set('slippageBps', String(req.slippageBps));

  const headers: Record<string, string> = {};
  const apiKey = getJupiterApiKey();
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    throw new Error(`Jupiter quote failed (${res.status})`);
  }
  return (await res.json()) as JupiterQuoteResponse;
}

export async function getJupiterSwapTransaction(args: {
  quoteResponse: JupiterQuoteResponse;
  userPublicKey: string;
}): Promise<JupiterSwapResponse> {
  const baseUrl = getJupiterBaseUrl();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const apiKey = getJupiterApiKey();
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  const res = await fetch(baseUrl + '/swap', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      quoteResponse: args.quoteResponse,
      userPublicKey: args.userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    }),
  });

  if (!res.ok) {
    throw new Error(`Jupiter swap failed (${res.status})`);
  }

  return (await res.json()) as JupiterSwapResponse;
}
