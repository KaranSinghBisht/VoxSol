import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { WalletProvider } from '@/components/wallet/WalletProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VoxSol - Voice-First Solana Wallet Copilot',
  description:
    'Talk to your Solana wallet. Swap tokens, check balances, and manage your portfolio with voice commands.',
  keywords: ['Solana', 'wallet', 'voice', 'AI', 'cryptocurrency', 'DeFi', 'swap'],
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'VoxSol - Voice-First Solana Wallet Copilot',
    description: 'Talk to your Solana wallet. Swap tokens with voice commands.',
    type: 'website',
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary',
    title: 'VoxSol - Voice-First Solana Wallet Copilot',
    description: 'Talk to your Solana wallet. Swap tokens with voice commands.',
    images: ['/logo.png'],
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
