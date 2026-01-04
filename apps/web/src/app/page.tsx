'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Mic, Zap, Shield, BarChart3, Repeat, ArrowRight, Database, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { AppRoute } from '@/types';
import Marquee from '@/components/effects/Marquee';

// Dynamic imports for heavy components
const Beams = dynamic(() => import('@/components/effects/Beams'), { ssr: false });
const MagicBento = dynamic(() => import('@/components/effects/MagicBento'), { ssr: false });

// Tech stack we actually use
const techStack = [
  'SOLANA',
  'PHANTOM',
  'GEMINI AI',
  'ELEVENLABS',
  'x402',
  'COINGECKO',
  'JUPITER',
  'DEVNET',
  'WEB SPEECH API',
];

// Feature cards data
const featureCards = [
  { icon: Mic, title: 'Voice Interaction', description: 'Natural language processing powered by Gemini AI, tuned for Solana DeFi.', label: 'Voice' },
  { icon: Repeat, title: 'Smart Swaps', description: 'Execute optimized token swaps on devnet with vault-backed liquidity.', label: 'Swap' },
  { icon: Shield, title: 'Non-Custodial', description: 'Your keys, your crypto. We never hold funds, you sign every transaction.', label: 'Security' },
  { icon: BarChart3, title: 'Live Portfolio', description: 'Real-time portfolio snapshots with price charts and balance tracking.', label: 'Analytics' },
  { icon: Zap, title: 'x402 Protocol', description: 'Micropayment gating for premium agent actions using HTTP 402.', label: 'Premium' },
  { icon: Database, title: 'Yield Vaults', description: 'One-click deposits into optimized yield strategies on Solana.', label: 'DeFi' },
];

export default function Landing() {
  const router = useRouter();

  return (
    <div className="overflow-x-hidden bg-[#030303] min-h-screen text-white">
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-32 pb-40">
        {/* Beams Animation Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Beams
            beamWidth={2}
            beamHeight={15}
            beamNumber={12}
            lightColor="#8b5cf6"
            speed={2}
            noiseIntensity={1.75}
            scale={0.2}
            rotation={0}
          />
        </div>

        {/* Gradient overlays */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-600/20 blur-[150px] rounded-full z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-600/15 blur-[120px] rounded-full z-10 pointer-events-none" />

        {/* Content */}
        <div className="relative z-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-[11px] font-mono uppercase tracking-widest text-purple-300 mb-8 backdrop-blur-sm">
            <Sparkles size={12} className="text-purple-400" />
            VoxSol v1.0 · Voice-First Solana Copilot
          </div>

          <h1 className="text-5xl md:text-8xl font-bold tracking-tight mb-8 leading-[0.9]">
            <span className="bg-gradient-to-b from-white via-white to-zinc-500 bg-clip-text text-transparent">
              Talk to your
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              Solana Wallet.
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-zinc-400 text-lg mb-12 leading-relaxed">
            The first voice-first Solana copilot. Execute swaps, manage yields, and track portfolios using natural language. Fast, secure, and non-custodial.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => router.push(AppRoute.CHAT)}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 border-0 shadow-lg shadow-purple-500/25"
            >
              Launch App
              <ArrowRight size={18} className="ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-zinc-700 hover:bg-zinc-800/50"
              onClick={() => router.push(AppRoute.DASHBOARD)}
            >
              View Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Tech Stack Marquee */}
      <section className="border-y border-zinc-800/50 bg-zinc-950/80 py-6">
        <Marquee items={techStack} speed={40} />
      </section>

      {/* Features Grid with Magic Bento */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <Badge>Features</Badge>
          <h2 className="text-3xl md:text-5xl font-bold mt-6 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            Built for the modern power user.
          </h2>
          <p className="text-zinc-500 mt-4 max-w-2xl mx-auto">
            Everything you need to interact with Solana DeFi using just your voice.
          </p>
        </div>

        <MagicBento
          cards={featureCards}
          glowColor="139, 92, 246"
          enableSpotlight={true}
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
        />
      </section>

      {/* Trust Section - Enhanced */}
      <section className="max-w-5xl mx-auto px-4 py-24">
        <div className="relative">
          {/* Animated border glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/50 via-cyan-500/50 to-purple-600/50 rounded-3xl blur-sm opacity-60 animate-pulse" />

          <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/50 rounded-3xl p-10 md:p-16 overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-cyan-500/10 blur-[80px] rounded-full" />

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Lock className="text-purple-400" size={24} />
                <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400">Security First</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
                <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                  &quot;Secure by architecture.&quot;
                </span>
              </h2>

              <p className="text-zinc-400 text-center mb-12 max-w-lg mx-auto leading-relaxed">
                VoxSol creates transaction payloads locally. You review and sign using your preferred wallet provider. We only facilitate the intent—never touch your keys.
              </p>

              <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                <TrustStat value="0" label="Private Keys Stored" />
                <div className="hidden md:block w-px h-16 bg-zinc-800" />
                <TrustStat value="100%" label="Non-Custodial" />
                <div className="hidden md:block w-px h-16 bg-zinc-800" />
                <TrustStat value="∞" label="Transparency" />
              </div>

              <div className="flex flex-wrap justify-center gap-4 mt-10 text-[10px] font-mono uppercase tracking-widest text-zinc-600">
                <span>Phantom</span>
                <span>•</span>
                <span>Solflare</span>
                <span>•</span>
                <span>Backpack</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="VoxSol" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-lg">VoxSol</span>
          </div>
          <div className="flex gap-8 text-zinc-500 text-sm">
            <a href="#" className="hover:text-purple-400 transition-colors">Docs</a>
            <a href="#" className="hover:text-purple-400 transition-colors">Twitter</a>
            <a href="#" className="hover:text-purple-400 transition-colors">GitHub</a>
            <a href="#" className="hover:text-purple-400 transition-colors">Security</a>
          </div>
          <div className="text-zinc-600 text-xs font-mono">© 2026 VOXSOL PROTOCOL</div>
        </div>
      </footer>
    </div>
  );
}

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-[10px] font-mono uppercase tracking-widest text-purple-400">
    {children}
  </span>
);

const TrustStat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
      {value}
    </span>
    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mt-2">
      {label}
    </span>
  </div>
);
