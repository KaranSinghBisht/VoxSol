# VoxSol - Voice-First Solana Wallet Copilot

> Talk to your Solana wallet. Execute swaps, manage yields, and track portfolios using natural language.

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?style=flat&logo=solana)](https://solana.com/)
[![Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?style=flat&logo=google)](https://ai.google.dev/)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-TTS-000000?style=flat)](https://elevenlabs.io/)

## Features

- **Voice Interaction** - Speak naturally to check balances, execute swaps, and manage your portfolio
- **AI-Powered** - Gemini AI understands complex DeFi commands and provides intelligent responses
- **Voice Responses** - ElevenLabs TTS speaks back with natural, human-like voice
- **Real Swaps** - Execute actual on-chain swaps on Solana Devnet via our vault
- **Live Charts** - TradingView integration for real-time price charts
- **Non-Custodial** - You control your keys. We only facilitate the intent.
- **x402 Protocol** - Micropayment gating for premium agent actions

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | Next.js 14, React, Tailwind CSS |
| AI | Gemini API (Google AI) |
| Voice | Web Speech API, ElevenLabs TTS |
| Blockchain | Solana (Devnet), @solana/web3.js |
| Wallet | Phantom, Solflare, Backpack |
| Charts | TradingView |
| Animations | GSAP, Three.js |

## Project Structure

```
VoxSol/
├── apps/
│   └── web/                 # Next.js frontend
│       ├── src/
│       │   ├── app/         # Next.js app router
│       │   ├── components/  # React components
│       │   └── hooks/       # Custom hooks
├── packages/
│   ├── shared/              # Shared types & utilities
│   └── worker/              # Cloudflare Worker
└── programs/                # Solana programs (Anchor)
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 9.0+
- Phantom wallet (set to Devnet)

### Installation

```bash
git clone https://github.com/KaranSinghBisht/VoxSol.git
cd VoxSol
pnpm install
```

### Environment Variables

Create `apps/web/.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
ELEVENLABS_API_KEY=your_elevenlabs_api_key
VAULT_PRIVATE_KEY=your_vault_private_key
```

### Run Development Server

```bash
cd apps/web
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Flow

1. Connect Phantom wallet (Devnet mode)
2. Say "Check my portfolio" - see formatted balances
3. Say "Show me SOL chart" - TradingView chart appears
4. Say "Swap 0.5 USDC to SOL" - execute real on-chain swap
5. Say "Deposit 0.01 SOL" - funds go to devnet vault

## API Routes

| Route | Description |
|-------|-------------|
| `/api/chat` | Gemini AI chat endpoint |
| `/api/tts` | ElevenLabs text-to-speech |
| `/api/vault-swap` | Devnet vault swap execution |

## Hackathon Prizes Targeted

- Best Use of Gemini API
- Best Use of ElevenLabs
- Best Use of Solana

## License

MIT

## Author

**Karan Singh Bisht**

- Twitter: [@Karan_Bisht09](https://x.com/Karan_Bisht09)
- GitHub: [@KaranSinghBisht](https://github.com/KaranSinghBisht)

---

Built for Hacks for Hackers 2026
