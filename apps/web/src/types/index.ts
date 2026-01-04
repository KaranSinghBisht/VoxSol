
export enum AppRoute {
    LANDING = '/',
    CHAT = '/chat',
    DASHBOARD = '/dashboard',
    VAULT = '/vault'
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    proposal?: TransactionProposal;
    timestamp: Date;
}

export interface TransactionProposal {
    type: 'swap' | 'transfer' | 'deposit';
    title: string;
    summary: string;
    details: {
        label: string;
        value: string;
    }[];
    riskLevel: 'low' | 'medium' | 'high';
    premium?: boolean;
    // For real swap execution
    swapParams?: {
        inputMint: string;
        outputMint: string;
        amount: number; // in smallest unit (lamports for SOL)
        slippageBps: number;
    };
    // For vault deposits
    depositParams?: {
        amount: number; // in lamports
    };
}

export interface TokenBalance {
    symbol: string;
    name: string;
    balance: number;
    usdValue: number;
    logo: string;
    change24h: number;
}
