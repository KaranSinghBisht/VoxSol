
'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, ExternalLink, RefreshCw, Layers, Database, Wallet } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useBalance } from '@/hooks/useBalance';

export default function Dashboard() {
    const { balances, totalValueUsd, loading, refresh, connected, publicKey } = useBalance();
    const [mounted, setMounted] = useState(false);

    // Fix hydration by only rendering wallet-dependent content on client
    useEffect(() => {
        setMounted(true);
    }, []);

    const shortKey = mounted && publicKey
        ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
        : 'Not connected';

    if (!mounted || loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12 space-y-12 animate-pulse">
                <div className="h-40 bg-zinc-900/50 rounded-3xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="h-64 bg-zinc-900/50 rounded-2xl" />
                    <div className="h-64 bg-zinc-900/50 rounded-2xl" />
                    <div className="h-64 bg-zinc-900/50 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12 space-y-12">
            {/* Portfolio Header */}
            <section className="relative overflow-hidden p-8 md:p-12 bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl">
                <div className="absolute top-0 right-0 p-8">
                    <Badge variant="success">Devnet</Badge>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-end justify-between gap-8">
                    <div>
                        <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                            Portfolio Net Worth
                            <RefreshCw size={12} className="cursor-pointer hover:rotate-180 transition-transform duration-500" />
                        </div>
                        <div className="text-4xl md:text-6xl font-bold tracking-tight text-white">
                            {connected ? `$${totalValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '--'}
                        </div>
                        <div className="mt-6 flex items-center gap-3">
                            <div className="px-3 py-1.5 bg-zinc-800 rounded-lg text-xs font-mono text-zinc-300 border border-zinc-700">
                                {shortKey}
                            </div>
                            <Button variant="ghost" size="sm" className="p-1">
                                <ExternalLink size={16} />
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <Button variant="outline" className="flex-1 md:flex-none">Send</Button>
                        <Button className="flex-1 md:flex-none">Receive</Button>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Assets List */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                        Your Assets
                        <span className="text-zinc-600 text-xs font-mono font-normal tracking-wider">{balances.length} Tokens</span>
                    </h3>
                    <Card className="divide-y divide-zinc-800/50">
                        {balances.map((token) => (
                            <div key={token.symbol} className="p-4 sm:p-6 flex items-center justify-between hover:bg-zinc-800/20 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-800">
                                        <img src={token.logo} alt={token.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{token.name}</div>
                                        <div className="text-xs text-zinc-500 font-mono">{token.balance.toFixed(4)} {token.symbol}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono text-white">${token.usdValue.toLocaleString()}</div>
                                    <div className={`text-[10px] font-mono flex items-center justify-end ${token.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {token.change24h >= 0 ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
                                        {Math.abs(token.change24h)}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Card>
                </div>

                {/* Sidebar Components */}
                <div className="space-y-8">
                    {/* Allowance Wallet Card - Coming Soon */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                            <Layers size={18} />
                            Allowance Sub-Wallet
                        </h3>
                        <Card className="p-6 bg-gradient-to-br from-indigo-950/20 to-zinc-900 border-indigo-500/20">
                            <div className="text-center py-4">
                                <div className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 mb-2">Coming Soon</div>
                                <p className="text-xs text-zinc-500 leading-relaxed">
                                    Allowance sub-wallets will allow VoxSol to execute trades up to a limit without individual signing.
                                </p>
                            </div>
                        </Card>
                    </section>

                    {/* Activity Feed - Shows real transactions or empty state */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-white">Activity Feed</h3>
                        {connected ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-center py-8 text-zinc-600 text-sm">
                                    <span>No recent transactions</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-8 text-zinc-600 text-sm">
                                <Wallet size={16} className="mr-2" />
                                <span>Connect wallet to view activity</span>
                            </div>
                        )}
                        <button className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-white transition-colors py-2">View All Transactions</button>
                    </section>
                </div>
            </div>
        </div>
    );
}
