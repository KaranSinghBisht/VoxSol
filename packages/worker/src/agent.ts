import { GoogleGenerativeAI } from '@google/generative-ai';
import { Context } from 'hono';
import {
  AgentRequestSchema,
  AgentResponseSchema,
  TOKEN_MINTS,
  type ActionProposal,
  type AgentResponse,
} from '@voxsol/shared';
import type { Env } from './index';

const SYSTEM_PROMPT = `You are VoxSol, a voice-first Solana wallet copilot.

RULES:
1. Output ONLY valid JSON matching the AgentResponse schema
2. NEVER request private keys or seed phrases
3. For swaps/transfers, restate exact amount, token, destination
4. For any transaction that moves assets, include risk notes
5. If unclear, ask a clarifying question
6. For swaps, include actionProposals with type SWAP and params { inputMint, outputMint, amount, slippageBps }

INTENTS: BALANCES, RECENT_TX, SWAP, VAULT_DEPOSIT, VAULT_WITHDRAW, TX_EXPLAIN, UNKNOWN

TOKEN MINTS:
SOL: ${TOKEN_MINTS.SOL}
USDC (devnet): ${TOKEN_MINTS.USDC_DEVNET}

Return JSON with keys assistantText, intent, optional actionProposals, optional clarifyingQuestion.`;

function buildSwapProposalFromMessage(message: string): ActionProposal | null {
  const match = message.match(
    /\bswap\s+([0-9]*\.?[0-9]+)\s*(sol|usdc)(?:\s*(?:to|->)\s*(sol|usdc))?/i
  );
  if (!match) return null;

  const amount = match[1];
  const from = match[2].toUpperCase();
  const to = (match[3] ?? (from === 'SOL' ? 'USDC' : 'SOL')).toUpperCase();

  if (from === to) return null;

  const inputMint = from === 'SOL' ? TOKEN_MINTS.SOL : TOKEN_MINTS.USDC_DEVNET;
  const outputMint = to === 'SOL' ? TOKEN_MINTS.SOL : TOKEN_MINTS.USDC_DEVNET;

  return {
    type: 'SWAP',
    summary: `Swap ${amount} ${from} to ${to}`,
    params: {
      inputMint,
      outputMint,
      amount,
      slippageBps: 50,
    },
    riskNotes: ['Review the exact amounts before signing in your wallet.'],
    cta: { label: 'Propose swap' },
  };
}

function buildVaultProposal(message: string): ActionProposal | null {
  const match = message.match(/\b(deposit|withdraw)\s+([0-9]*\.?[0-9]+)\s*sol\b/i);
  if (!match) return null;

  const action = match[1].toLowerCase() as 'deposit' | 'withdraw';
  const amount = match[2];

  return {
    type: action === 'deposit' ? 'VAULT_DEPOSIT' : 'VAULT_WITHDRAW',
    summary: `${action === 'deposit' ? 'Deposit' : 'Withdraw'} ${amount} SOL ${
      action === 'deposit' ? 'into' : 'from'
    } yield vault`,
    params: {
      amount,
      action,
    },
    riskNotes: [
      'Your funds will be moved to the vault program PDA.',
      'Yield is simulated for this hackathon demo.',
    ],
    cta: { label: action === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdraw' },
  };
}

export async function agentHandler(c: Context<{ Bindings: Env }>) {
  try {
    const body = await c.req.json();
    const parsed = AgentRequestSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', details: parsed.error.issues }, 400);
    }

    const { message, walletPubkey, context } = parsed.data;

    const genAI = new GoogleGenerativeAI(c.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const contextStr = context
      ? `\nUser context: Wallet ${walletPubkey}, Balances: ${JSON.stringify(context.balances || {})}`
      : `\nUser wallet: ${walletPubkey}`;

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: contextStr },
      { text: `User message: ${message}` },
    ]);

    const responseText = result.response.text();
    let agentResponse: AgentResponse;

    try {
      const jsonResponse = JSON.parse(responseText);
      const validated = AgentResponseSchema.safeParse(jsonResponse);

      if (!validated.success) {
        agentResponse = {
          assistantText: "I'm having trouble processing that request. Could you try again?",
          intent: 'UNKNOWN',
        };
      } else {
        agentResponse = validated.data;
      }
    } catch {
      agentResponse = {
        assistantText: "I'm having trouble processing that request. Could you try again?",
        intent: 'UNKNOWN',
      };
    }

    const swapProposal = buildSwapProposalFromMessage(message);
    if (swapProposal) {
      agentResponse = {
        ...agentResponse,
        intent: 'SWAP',
        actionProposals: [swapProposal],
      };
    }

    const vaultProposal = buildVaultProposal(message);
    if (vaultProposal) {
      agentResponse = {
        ...agentResponse,
        intent: vaultProposal.type === 'VAULT_DEPOSIT' ? 'VAULT_DEPOSIT' : 'VAULT_WITHDRAW',
        actionProposals: [vaultProposal],
      };
    }

    return c.json(agentResponse);
  } catch (error) {
    console.error('Agent error:', error);
    return c.json({ error: 'Failed to process request' }, 500);
  }
}
