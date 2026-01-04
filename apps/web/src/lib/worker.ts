'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useBalance } from '@/hooks/useBalance';

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787';

export interface AgentRequest {
    message: string;
    walletPubkey: string;
    context?: {
        balances?: Record<string, number>;
        recentTx?: string[];
        selectedToken?: string;
    };
    sessionId?: string;
}

export interface ActionProposal {
    type: 'SWAP' | 'TRANSFER' | 'VAULT_DEPOSIT' | 'VAULT_WITHDRAW';
    summary: string;
    params: Record<string, any>;
    riskNotes?: string[];
    cta: { label: string };
}

export interface AgentResponse {
    assistantText: string;
    intent: 'BALANCES' | 'RECENT_TX' | 'SWAP' | 'VAULT_DEPOSIT' | 'VAULT_WITHDRAW' | 'TX_EXPLAIN' | 'CHART' | 'UNKNOWN';
    actionProposals?: ActionProposal[];
    clarifyingQuestion?: string;
    toolResult?: any;
    payment?: {
        required: boolean;
        priceUsdc?: string;
        tool?: string;
    };
}

export interface PaymentRequirements {
    paymentId: string;
    amount: number;
    tokenMint: string;
    recipient: string;
    network: string;
    expiresAt: number;
    tool: string;
}

/**
 * Call the Cloudflare Worker's /agent endpoint
 */
export async function callAgent(request: AgentRequest): Promise<AgentResponse> {
    const response = await fetch(`${WORKER_URL}/agent`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error(`Agent request failed: ${response.status}`);
    }

    return response.json();
}

/**
 * Call a premium tool endpoint with x402 payment handling
 */
export async function callTool(
    toolName: string,
    params: Record<string, any>,
    paymentProof?: { paymentId: string; signature: string; payer: string }
): Promise<{ result: any; paymentRequired?: PaymentRequirements }> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (paymentProof) {
        headers['X-Payment'] = JSON.stringify(paymentProof);
    }

    const response = await fetch(`${WORKER_URL}/tools/${toolName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
    });

    // Handle x402 Payment Required
    if (response.status === 402) {
        const requirementsHeader = response.headers.get('X-Payment-Required');
        if (requirementsHeader) {
            const requirements = JSON.parse(requirementsHeader) as PaymentRequirements;
            return { result: null, paymentRequired: requirements };
        }
        throw new Error('Payment required but no requirements provided');
    }

    if (!response.ok) {
        throw new Error(`Tool request failed: ${response.status}`);
    }

    return { result: await response.json() };
}

/**
 * Hook to use the VoxSol agent with wallet context
 */
export function useAgent() {
    const { publicKey } = useWallet();
    const { balances, solBalance } = useBalance();

    const sendMessage = async (message: string): Promise<AgentResponse> => {
        if (!publicKey) {
            return {
                assistantText: 'Please connect your wallet to continue.',
                intent: 'UNKNOWN',
            };
        }

        // Build balances context
        const balancesContext: Record<string, number> = {};
        balances.forEach((token) => {
            balancesContext[token.symbol] = token.balance;
        });

        const request: AgentRequest = {
            message,
            walletPubkey: publicKey.toBase58(),
            context: {
                balances: balancesContext,
            },
        };

        return callAgent(request);
    };

    return {
        sendMessage,
        callTool,
        connected: !!publicKey,
        walletPubkey: publicKey?.toBase58(),
    };
}
