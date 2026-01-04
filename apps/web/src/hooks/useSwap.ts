'use client';

import { useCallback, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction, PublicKey } from '@solana/web3.js';
import { createJupiterApiClient, QuoteResponse } from '@jup-ag/api';

// Devnet mode - Jupiter doesn't support devnet, so swaps are simulated for demo
const DEVNET_MODE = true;

// Token mints - using devnet tokens
export const TOKENS = {
    SOL: 'So11111111111111111111111111111111111111112',
    // Devnet USDC
    USDC: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
    // Keep mainnet references for reference
    USDC_MAINNET: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
};

export interface SwapQuote {
    inputMint: string;
    outputMint: string;
    inputAmount: string;
    outputAmount: string;
    priceImpactPct: number;
    routePlan: { swapInfo: { label: string } }[];
    slippageBps: number;
}

export function useSwap() {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const jupiterApi = createJupiterApiClient();

    const getQuote = useCallback(
        async (
            inputMint: string,
            outputMint: string,
            amount: number, // in lamports or smallest unit
            slippageBps: number = 50
        ): Promise<QuoteResponse | null> => {
            setError(null);

            // On devnet, simulate the quote since Jupiter doesn't support devnet
            if (DEVNET_MODE) {
                // Simulate: 1 SOL ≈ 150 USDC (approximate price)
                const SOL_PRICE = 150;
                let outputAmount: number;

                if (inputMint === TOKENS.SOL) {
                    // SOL -> USDC: amount in lamports, output in USDC smallest unit (6 decimals)
                    outputAmount = Math.floor((amount / 1e9) * SOL_PRICE * 1e6);
                } else {
                    // USDC -> SOL: amount in USDC smallest unit, output in lamports
                    outputAmount = Math.floor((amount / 1e6 / SOL_PRICE) * 1e9);
                }

                return {
                    inputMint,
                    outputMint,
                    inAmount: amount.toString(),
                    outAmount: outputAmount.toString(),
                    priceImpactPct: '0.01',
                    slippageBps,
                    otherAmountThreshold: outputAmount.toString(),
                    swapMode: 'ExactIn',
                    routePlan: [{ swapInfo: { label: 'Jupiter (Simulated for Devnet)' } }] as any,
                } as QuoteResponse;
            }

            try {
                const quote = await jupiterApi.quoteGet({
                    inputMint,
                    outputMint,
                    amount,
                    slippageBps,
                });
                return quote;
            } catch (err: any) {
                setError(err.message);
                return null;
            }
        },
        [jupiterApi]
    );

    const executeSwap = useCallback(
        async (quote: QuoteResponse): Promise<string | null> => {
            if (!wallet.publicKey || !wallet.signTransaction) {
                setError('Wallet not connected');
                return null;
            }

            setLoading(true);
            setError(null);

            try {
                // On devnet, use our vault-swap API for real on-chain swaps
                if (DEVNET_MODE) {
                    const direction = quote.inputMint === TOKENS.SOL ? 'SOL_TO_USDC' : 'USDC_TO_SOL';
                    const amount = quote.inputMint === TOKENS.SOL
                        ? parseInt(quote.inAmount) / 1e9 // Convert lamports to SOL
                        : parseInt(quote.inAmount) / 1e6; // Convert USDC smallest unit to USDC

                    const response = await fetch('/api/vault-swap', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            direction,
                            amount: amount.toString(),
                            userWallet: wallet.publicKey!.toBase58(),
                        }),
                    });

                    const result = await response.json();

                    if (!response.ok || !result.success) {
                        throw new Error(result.error || 'Vault swap failed');
                    }

                    console.log('Vault swap completed:', result);
                    return result.txSignature;
                }

                // Mainnet: Use Jupiter API for real swaps
                const swapResult = await jupiterApi.swapPost({
                    swapRequest: {
                        quoteResponse: quote,
                        userPublicKey: wallet.publicKey.toBase58(),
                        wrapAndUnwrapSol: true,
                    },
                });

                // Deserialize the transaction
                const swapTransactionBuf = Buffer.from(swapResult.swapTransaction, 'base64');
                const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

                // Sign the transaction
                const signedTransaction = await wallet.signTransaction(transaction);

                // Execute the transaction
                const rawTransaction = signedTransaction.serialize();
                const txid = await connection.sendRawTransaction(rawTransaction, {
                    skipPreflight: true,
                    maxRetries: 2,
                });

                // Confirm the transaction
                await connection.confirmTransaction(txid, 'confirmed');

                return txid;
            } catch (err: any) {
                setError(err.message);
                return null;
            } finally {
                setLoading(false);
            }
        },
        [connection, wallet, jupiterApi]
    );

    const swapSolToToken = useCallback(
        async (outputMint: string, solAmount: number, slippageBps: number = 50) => {
            const lamports = Math.floor(solAmount * 1e9);
            const quote = await getQuote(TOKENS.SOL, outputMint, lamports, slippageBps);
            if (!quote) return null;
            return executeSwap(quote);
        },
        [getQuote, executeSwap]
    );

    const swapTokenToSol = useCallback(
        async (inputMint: string, tokenAmount: number, decimals: number, slippageBps: number = 50) => {
            const amount = Math.floor(tokenAmount * Math.pow(10, decimals));
            const quote = await getQuote(inputMint, TOKENS.SOL, amount, slippageBps);
            if (!quote) return null;
            return executeSwap(quote);
        },
        [getQuote, executeSwap]
    );

    return {
        getQuote,
        executeSwap,
        swapSolToToken,
        swapTokenToSol,
        loading,
        error,
        TOKENS,
    };
}
