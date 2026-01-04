'use client';

import { useEffect, useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

export interface TokenBalance {
    symbol: string;
    name: string;
    balance: number;
    usdValue: number;
    logo: string;
    change24h: number;
    mint?: string;
}

// Approximate SOL price - in production, fetch from an oracle or API
const SOL_PRICE_USD = 150;

export function useBalance() {
    const { connection } = useConnection();
    const { publicKey, connected } = useWallet();
    const [solBalance, setSolBalance] = useState<number>(0);
    const [balances, setBalances] = useState<TokenBalance[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBalances = useCallback(async () => {
        if (!publicKey || !connected) {
            setSolBalance(0);
            setBalances([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Fetch SOL balance
            const lamports = await connection.getBalance(publicKey);
            const sol = lamports / LAMPORTS_PER_SOL;
            setSolBalance(sol);

            // Create balance array with SOL
            const tokenBalances: TokenBalance[] = [
                {
                    symbol: 'SOL',
                    name: 'Solana',
                    balance: sol,
                    usdValue: sol * SOL_PRICE_USD,
                    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
                    change24h: 2.5,
                    mint: 'So11111111111111111111111111111111111111112',
                },
            ];

            // Fetch SPL token accounts
            try {
                const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
                    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                });

                for (const { account } of tokenAccounts.value) {
                    const parsed = account.data.parsed.info;
                    const mint = parsed.mint;
                    const balance = parsed.tokenAmount.uiAmount || 0;

                    if (balance > 0) {
                        // Add known tokens
                        if (mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
                            tokenBalances.push({
                                symbol: 'USDC',
                                name: 'USD Coin',
                                balance,
                                usdValue: balance, // 1:1 for stablecoins
                                logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
                                change24h: 0,
                                mint,
                            });
                        } else if (mint === 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB') {
                            tokenBalances.push({
                                symbol: 'USDT',
                                name: 'Tether USD',
                                balance,
                                usdValue: balance,
                                logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg',
                                change24h: 0,
                                mint,
                            });
                        } else {
                            // Unknown token
                            tokenBalances.push({
                                symbol: mint.slice(0, 4) + '...',
                                name: 'Unknown Token',
                                balance,
                                usdValue: 0,
                                logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
                                change24h: 0,
                                mint,
                            });
                        }
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch SPL tokens:', err);
            }

            setBalances(tokenBalances);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [connection, publicKey, connected]);

    useEffect(() => {
        fetchBalances();
    }, [fetchBalances]);

    const totalValueUsd = balances.reduce((acc, token) => acc + token.usdValue, 0);

    return {
        solBalance,
        balances,
        totalValueUsd,
        loading,
        error,
        refresh: fetchBalances,
        connected,
        publicKey,
    };
}
