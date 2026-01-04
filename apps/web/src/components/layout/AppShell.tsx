
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Wallet, MessageSquare, LayoutDashboard, Database, ChevronDown, Menu, X, Command } from 'lucide-react';
import { Button } from '../ui';
import { AppRoute } from '@/types';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCommandOpen, setIsCommandOpen] = useState(false);

    const pathname = usePathname();
    const router = useRouter();
    const wallet = useAnchorWallet();
    const { setVisible } = useWalletModal();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const navItems = [
        { label: 'Chat', icon: MessageSquare, path: AppRoute.CHAT },
        { label: 'Dashboard', icon: LayoutDashboard, path: AppRoute.DASHBOARD },
        { label: 'Vault', icon: Database, path: AppRoute.VAULT },
    ];

    const toggleWallet = () => {
        if (!wallet) {
            setVisible(true);
        }
    };

    const isWalletConnected = !!wallet;
    const publicKeyStr = wallet?.publicKey.toBase58();
    const shortKey = publicKeyStr ? `${publicKeyStr.slice(0, 4)}...${publicKeyStr.slice(-4)}` : '';

    return (
        <div className="min-h-screen bg-[#030303] flex flex-col">
            {/* Top Navigation */}
            <header className="sticky top-0 z-40 border-b border-zinc-900 bg-black/60 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link
                            href={AppRoute.LANDING}
                            className="flex items-center gap-2 cursor-pointer group"
                        >
                            <img
                                src="/logo.png"
                                alt="VoxSol"
                                className="w-8 h-8 rounded-lg rotate-3 group-hover:rotate-0 transition-transform"
                            />
                            <span className="font-bold text-xl tracking-tight hidden sm:block">VoxSol</span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => {
                                const isActive = pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={`
                      flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors
                      ${isActive ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'}
                    `}
                                    >
                                        <item.icon size={16} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsCommandOpen(true)}
                            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-500 text-xs hover:bg-zinc-900 transition-colors"
                        >
                            <Command size={14} />
                            <span>Search Actions</span>
                            <span className="ml-4 font-mono">⌘K</span>
                        </button>

                        <Button
                            variant={isWalletConnected ? 'outline' : 'primary'}
                            size="sm"
                            onClick={toggleWallet}
                            className="font-mono"
                        >
                            {isWalletConnected ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span>{shortKey}</span>
                                    <ChevronDown size={14} />
                                </div>
                            ) : (
                                'Connect Wallet'
                            )}
                        </Button>

                        <button
                            className="md:hidden p-2 text-zinc-400 hover:text-white"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-30 bg-black pt-20 px-6">
                    <nav className="flex flex-col gap-6">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                href={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-4 text-2xl font-semibold text-zinc-500 hover:text-white transition-colors"
                            >
                                <item.icon size={28} />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}

            {/* Command Palette Mock */}
            {isCommandOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsCommandOpen(false)}>
                    <div
                        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center px-4 py-3 border-b border-zinc-800">
                            <Command size={18} className="text-zinc-500 mr-3" />
                            <input
                                autoFocus
                                placeholder="Jump to..."
                                className="bg-transparent border-none outline-none text-white w-full text-base"
                            />
                        </div>
                        <div className="p-2">
                            <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Suggestions</div>
                            {['Dashboard', 'Recent Transactions', 'Swap SOL to USDC', 'Vault Statistics'].map((item) => (
                                <button key={item} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
                                    <span>{item}</span>
                                    <span className="text-[10px] font-mono text-zinc-600">Action</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-grow">
                {children}
            </main>

            {/* Bottom Nav (Mobile Only) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black border-t border-zinc-900 flex items-center justify-around z-40 px-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex flex-col items-center gap-1 ${isActive ? 'text-white' : 'text-zinc-600'}`}
                        >
                            <item.icon size={20} />
                            <span className="text-[10px] uppercase tracking-tighter font-bold">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
