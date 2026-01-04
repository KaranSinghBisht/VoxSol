
'use client';

import React, { useState, useEffect } from 'react';
import { Info, Shield, Zap, TrendingUp, ArrowRight, History, Wallet } from 'lucide-react';
import { Card, Button, Badge, Input } from '@/components/ui';
import { useVault } from '@/hooks/useVault';
import { useBalance } from '@/hooks/useBalance';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export default function Vault() {
    const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
    const [amount, setAmount] = useState('');
    const [mounted, setMounted] = useState(false);
    const [userPosition, setUserPosition] = useState<any>(null);

    const { vaultState, deposit, withdraw, loading, getPosition } = useVault();
    const { solBalance, connected } = useBalance();

    // Fix hydration by only rendering on client
    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch user position
    useEffect(() => {
        if (mounted && connected) {
            getPosition().then(setUserPosition);
        }
    }, [mounted, connected, getPosition]);

    const handleAction = async () => {
        if (!amount || isNaN(Number(amount))) return;
        try {
            const lamports = Math.floor(Number(amount) * LAMPORTS_PER_SOL);
            if (activeTab === 'deposit') {
                await deposit(lamports);
            } else {
                await withdraw(lamports);
            }
            setAmount('');
            // Refresh position after action
            const pos = await getPosition();
            setUserPosition(pos);
        } catch (err) {
            console.error(err);
        }
    };

    const apy = vaultState ? (Number(vaultState.apyBps) / 100).toFixed(2) : '14.22';
    const tvl = vaultState ? (Number(vaultState.totalDeposited) / LAMPORTS_PER_SOL).toFixed(4) : '0';
    const userDeposit = userPosition ? (Number(userPosition.amount) / LAMPORTS_PER_SOL).toFixed(4) : '0';
    const userDepositUsd = userPosition ? (Number(userPosition.amount) / LAMPORTS_PER_SOL * 150).toFixed(2) : '0';

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Stats & Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <Badge variant="success">Verified Strategy</Badge>
                        <h1 className="text-4xl font-bold mt-4 mb-2 text-white">Solana Yield Vault</h1>
                        <p className="text-zinc-500 text-lg leading-relaxed">
                            Automated stablecoin yield aggregator routing through Drift, Kamino, and Meteora. Optimized for risk-adjusted returns.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: 'Current APY', value: `${apy}%`, color: 'text-emerald-400' },
                            { label: 'Total Value Locked', value: `${tvl} SOL`, color: 'text-white' },
                            { label: 'Your Deposits', value: `${userDeposit} SOL`, subValue: `≈ $${userDepositUsd}`, color: 'text-white' },
                        ].map((stat) => (
                            <Card key={stat.label} className="p-6">
                                <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-1">{stat.label}</div>
                                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                                {stat.subValue && <div className="text-xs text-zinc-500 mt-1">{stat.subValue}</div>}
                            </Card>
                        ))}
                    </div>

                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-white">Strategy Composition</h3>
                        <Card className="p-6 space-y-6">
                            {[
                                { name: 'Drift Insurance Fund', share: 45, risk: 'Low', icon: Shield },
                                { name: 'Meteora DLMM', share: 30, risk: 'Medium', icon: Zap },
                                { name: 'Kino Lending', share: 25, risk: 'Low', icon: TrendingUp },
                            ].map((comp) => (
                                <div key={comp.name} className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <comp.icon size={16} className="text-zinc-500" />
                                            <span className="font-medium text-zinc-200">{comp.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge>{comp.risk}</Badge>
                                            <span className="font-mono text-zinc-400">{comp.share}%</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-zinc-400" style={{ width: `${comp.share}%` }} />
                                    </div>
                                </div>
                            ))}
                        </Card>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                            <History size={18} />
                            Recent Yield Events
                        </h3>
                        {connected ? (
                            <div className="flex items-center justify-center py-8 text-zinc-600 text-sm">
                                <span>No yield events yet</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-8 text-zinc-600 text-sm">
                                <Wallet size={16} className="mr-2" />
                                <span>Connect wallet to view events</span>
                            </div>
                        )}
                    </section>
                </div>

                {/* Right Column: Interaction Card */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-24 border-zinc-700 bg-zinc-900/80 shadow-2xl">
                        <div className="p-1 flex border-b border-zinc-800">
                            <button
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'deposit' ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                                onClick={() => setActiveTab('deposit')}
                            >
                                Deposit
                            </button>
                            <button
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'withdraw' ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                                onClick={() => setActiveTab('withdraw')}
                            >
                                Withdraw
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <div className="flex justify-between text-[10px] font-mono uppercase text-zinc-500 mb-2">
                                    <span>Amount to {activeTab} (SOL)</span>
                                    <span className="cursor-pointer hover:text-white" onClick={() => setAmount(solBalance.toFixed(4))}>Max: {solBalance.toFixed(4)} SOL</span>
                                </div>
                                <div className="relative">
                                    <Input
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="h-14 text-xl font-mono pr-16"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-zinc-500 text-sm">SOL</div>
                                </div>
                            </div>

                            <div className="space-y-3 p-4 bg-black/40 rounded-xl border border-zinc-800/50">
                                <div className="flex justify-between text-xs">
                                    <span className="text-zinc-500 flex items-center gap-1.5">
                                        Est. Annual Profit
                                        <Info size={12} />
                                    </span>
                                    <span className="text-emerald-500 font-mono">
                                        {amount && !isNaN(Number(amount))
                                            ? `+${(Number(amount) * (Number(apy) / 100)).toFixed(3)} SOL`
                                            : '--'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-zinc-500">Wait Time</span>
                                    <span className="text-zinc-200 font-mono">Instant</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-zinc-500">Protocol Fee</span>
                                    <span className="text-zinc-200 font-mono">0.05%</span>
                                </div>
                            </div>

                            <Button
                                size="lg"
                                className="w-full font-mono uppercase tracking-widest text-xs py-5"
                                onClick={handleAction}
                                isLoading={loading}
                            >
                                Confirm {activeTab}
                                <ArrowRight size={16} className="ml-2" />
                            </Button>

                            <div className="text-center">
                                <p className="text-[10px] text-zinc-600 leading-relaxed px-4">
                                    By executing this transaction, you agree to the smart contract risk of the underlying protocols.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
