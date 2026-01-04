
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, ChevronRight, AlertCircle, Zap, ShieldAlert, Volume2, VolumeX, Square } from 'lucide-react';
import { Card, Button, Input, Badge } from '@/components/ui';
import { Message, TransactionProposal } from '@/types';
import { SUGGESTED_PROMPTS } from '@/lib/constants';
import { useSwap } from '@/hooks/useSwap';
import { useVault } from '@/hooks/useVault';
import { useTTS } from '@/hooks/useTTS';
import { useBalance } from '@/hooks/useBalance';
import { useAgent } from '@/lib/worker';
import { ChartCard } from '@/components/chat/ChartCard';

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [ttsMuted, setTtsMuted] = useState(false);
    const [chartToken, setChartToken] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Hooks
    const { speak, stop: stopTTS, isSpeaking } = useTTS();
    const { sendMessage: sendToWorker, connected: walletConnected } = useAgent();
    const { solBalance, balances } = useBalance();

    // Helper to strip markdown from AI responses
    const formatMessage = (text: string) => {
        return text
            .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
            .replace(/\*([^*]+)\*/g, '$1') // italic
            .replace(/`([^`]+)`/g, '$1') // code
            .replace(/#{1,6}\s/g, '') // headers
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
            .trim();
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);
        setChartToken(null); // Reset chart

        try {
            let responseText = '';
            let intent = 'UNKNOWN';

            // Check for chart intent locally first - handle various patterns
            const lowerText = text.toLowerCase();
            const tokens = ['sol', 'solana', 'btc', 'bitcoin', 'eth', 'ethereum', 'usdc'];
            let chartToken = null;

            // Check if any chart-related keywords exist
            if (lowerText.includes('chart') || lowerText.includes('price') ||
                (lowerText.includes('show') && tokens.some(t => lowerText.includes(t)))) {
                // Find which token is mentioned
                for (const token of tokens) {
                    if (lowerText.includes(token)) {
                        chartToken = token.toUpperCase();
                        if (chartToken === 'SOLANA') chartToken = 'SOL';
                        if (chartToken === 'BITCOIN') chartToken = 'BTC';
                        if (chartToken === 'ETHEREUM') chartToken = 'ETH';
                        break;
                    }
                }
            }

            if (chartToken) {
                setChartToken(chartToken);
                responseText = `Here's the ${chartToken} price chart for the last 30 days.`;
                intent = 'CHART';
            }

            // Try worker first, fallback to local API
            if (!responseText) {
                try {
                    const workerResponse = await sendToWorker(text);
                    responseText = workerResponse.assistantText;
                    intent = workerResponse.intent;
                } catch (workerError) {
                    console.warn('Worker unavailable, falling back to local API:', workerError);
                    // Fallback to local /api/chat
                    // Build balance context for AI
                    const balanceContext = balances.length > 0
                        ? `User's wallet balances: ${balances.map(b => `${b.balance.toFixed(4)} ${b.symbol} ($${b.usdValue.toFixed(2)})`).join(', ')}. Total portfolio value: $${balances.reduce((sum, b) => sum + b.usdValue, 0).toFixed(2)}.`
                        : 'Wallet not connected or no balances available.';

                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            prompt: `${balanceContext}\n\nUser request: ${text}`,
                            history: messages.map(m => ({ role: m.role, content: m.content })),
                        }),
                    });
                    const data = await response.json();
                    responseText = data.text || "I'm ready to help with your Solana transactions.";
                }
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText || "I'm ready to help with your Solana transactions.",
                timestamp: new Date()
            };


            // Mocking a proposal if keywords match (keeping this for now as parsing logic is not yet implemented)
            if (text.toLowerCase().includes('swap')) {
                assistantMessage.proposal = {
                    type: 'swap',
                    title: 'Swap Proposal',
                    summary: 'Executing via Jupiter Aggregator',
                    details: [
                        { label: 'Sell', value: '0.1 SOL' },
                        { label: 'Receive', value: '≈ USDC' },
                        { label: 'Slippage', value: '0.5%' },
                        { label: 'Network Fee', value: '~0.000005 SOL' }
                    ],
                    riskLevel: 'low',
                    swapParams: {
                        inputMint: 'So11111111111111111111111111111111111111112', // SOL
                        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
                        amount: 100000000, // 0.1 SOL in lamports
                        slippageBps: 50,
                    }
                };
            } else if (text.toLowerCase().includes('deposit') || text.toLowerCase().includes('vault')) {
                assistantMessage.proposal = {
                    type: 'deposit',
                    title: 'Vault Deposit',
                    summary: 'VoxSol Yield Vault',
                    details: [
                        { label: 'Amount', value: '0.01 SOL' },
                        { label: 'Estimated APY', value: '12.4%' },
                        { label: 'Lock period', value: 'None' }
                    ],
                    riskLevel: 'medium',
                    premium: true,
                    depositParams: {
                        amount: 10000000, // 0.01 SOL in lamports
                    }
                };
            }

            setMessages(prev => [...prev, assistantMessage]);

            // Speak the AI response if TTS is enabled
            if (!ttsMuted && responseText) {
                speak(responseText);
            }

        } catch (err) {
            console.error('Chat error:', err);
        } finally {
            setIsTyping(false);
        }
    };

    const toggleVoice = () => {
        if (isListening) {
            // Stop listening
            setIsListening(false);
            return;
        }

        // Check for browser support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in this browser. Please use Chrome.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputValue(transcript);
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                alert('Microphone access denied. Please allow microphone access to use voice input.');
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col max-w-4xl mx-auto py-4">
            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-grow overflow-y-auto px-4 py-4 space-y-8 no-scrollbar"
            >
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 text-zinc-500">
                            <Mic size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">How can I help you today?</h2>
                        <p className="text-zinc-500 mb-10 max-w-sm">
                            Ask me to swap tokens, check your portfolio, or deposit into yield vaults.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {SUGGESTED_PROMPTS.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => handleSend(prompt)}
                                    className="px-4 py-2 rounded-full border border-zinc-800 text-xs text-zinc-400 hover:border-zinc-700 hover:text-white hover:bg-zinc-900 transition-all"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`
              max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed
              ${msg.role === 'user'
                                ? 'bg-zinc-900 text-white rounded-br-none border border-zinc-800'
                                : 'bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/60 text-zinc-200 rounded-bl-none'}
            `}>
                            {msg.role === 'assistant' ? formatMessage(msg.content) : msg.content}
                        </div>

                        {msg.proposal && (
                            <div className="mt-4 w-full sm:w-[380px]">
                                <ProposalCard proposal={msg.proposal} />
                            </div>
                        )}

                        <div className="mt-2 text-[10px] font-mono text-zinc-600 uppercase">
                            {msg.role === 'assistant' ? 'VoxSol' : 'You'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                ))}

                {/* Chart Display */}
                {chartToken && (
                    <div className="flex flex-col items-start">
                        <div className="w-full sm:w-[380px]">
                            <ChartCard token={chartToken} days={30} />
                        </div>
                    </div>
                )}

                {isTyping && (
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono">
                        <div className="flex gap-1">
                            <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" />
                            <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                        <span>VoxSol is thinking...</span>
                    </div>
                )}
            </div>

            {/* Input Bar Area */}
            <div className="p-4 sm:p-6 border-t border-zinc-900 bg-black/50 backdrop-blur-sm rounded-t-3xl">
                <div className="max-w-4xl mx-auto flex flex-col gap-4">
                    <div className="relative group">
                        <div className={`absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none`} />
                        <div className="relative flex items-center bg-zinc-900/80 border border-zinc-800 rounded-2xl px-4 h-14 backdrop-blur-xl">
                            <input
                                className="flex-grow bg-transparent border-none outline-none text-white px-3 text-sm placeholder:text-zinc-600"
                                placeholder="Message VoxSol..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                            />

                            <div className="flex items-center gap-1">
                                {/* TTS Mute Toggle */}
                                <button
                                    onClick={() => setTtsMuted(!ttsMuted)}
                                    className={`p-2 rounded-xl transition-all ${ttsMuted ? 'text-rose-500' : 'text-zinc-500 hover:text-white'}`}
                                    title={ttsMuted ? 'TTS Muted (Click to Enable)' : 'TTS Enabled (Click to Mute)'}
                                >
                                    {ttsMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                </button>
                                {/* Stop TTS Button - Only visible when speaking */}
                                {isSpeaking && (
                                    <button
                                        onClick={stopTTS}
                                        className="p-2 rounded-xl bg-rose-500 text-white animate-pulse transition-all"
                                        title="Stop Speaking"
                                    >
                                        <Square size={16} fill="currentColor" />
                                    </button>
                                )}
                                {/* Microphone */}
                                <button
                                    onClick={toggleVoice}
                                    className={`p-2 rounded-xl transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-zinc-500 hover:text-white'}`}
                                >
                                    <Mic size={20} />
                                </button>
                                {/* Send */}
                                <button
                                    onClick={() => handleSend(inputValue)}
                                    disabled={!inputValue.trim()}
                                    className="p-2 bg-white text-black rounded-xl hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white transition-all ml-1"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                            <ShieldAlert size={10} />
                            Non-Custodial
                        </div>
                        <div className="w-[3px] h-[3px] bg-zinc-800 rounded-full" />
                        <div className="flex items-center gap-1.5">
                            <Zap size={10} />
                            x402 Protocol
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const ProposalCard: React.FC<{ proposal: TransactionProposal }> = ({ proposal }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [txResult, setTxResult] = useState<{ success: boolean; txId?: string; error?: string } | null>(null);
    const { getQuote, executeSwap, loading: swapLoading, error: swapError } = useSwap();
    const { deposit, loading: vaultLoading } = useVault();

    const handleExecute = async () => {
        setIsExecuting(true);
        setTxResult(null);

        try {
            if (proposal.type === 'swap' && proposal.swapParams) {
                const quote = await getQuote(
                    proposal.swapParams.inputMint,
                    proposal.swapParams.outputMint,
                    proposal.swapParams.amount,
                    proposal.swapParams.slippageBps
                );
                if (quote) {
                    const txId = await executeSwap(quote);
                    if (txId) {
                        setTxResult({ success: true, txId });
                    } else {
                        setTxResult({ success: false, error: swapError || 'Swap failed' });
                    }
                } else {
                    setTxResult({ success: false, error: 'Failed to get quote' });
                }
            } else if (proposal.type === 'deposit' && proposal.depositParams) {
                const txId = await deposit(proposal.depositParams.amount);
                if (txId) {
                    setTxResult({ success: true, txId });
                } else {
                    setTxResult({ success: false, error: 'Deposit failed' });
                }
            } else {
                // Demo mode - show success after delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                setTxResult({ success: true, txId: 'DEMO_' + Math.random().toString(36).substr(2, 8).toUpperCase() });
            }
        } catch (err: any) {
            setTxResult({ success: false, error: err.message });
        } finally {
            setIsExecuting(false);
        }
    };

    const isLoading = isExecuting || swapLoading || vaultLoading;

    return (
        <Card className="p-0 border-zinc-800 group hover:border-zinc-700 transition-all shadow-xl">
            <div className="p-4 border-b border-zinc-800/50">
                <div className="flex items-center justify-between mb-1">
                    <Badge variant={proposal.riskLevel === 'low' ? 'success' : 'warning'}>
                        {proposal.type} proposal
                    </Badge>
                    <span className="text-[10px] text-zinc-500 font-mono">ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                </div>
                <h3 className="text-base font-bold text-white">{proposal.title}</h3>
                <p className="text-zinc-400 text-xs mt-1">{proposal.summary}</p>
            </div>

            <div className="px-4 py-3 space-y-2">
                {proposal.details.map((detail, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500">{detail.label}</span>
                        <span className="text-zinc-200 font-mono">{detail.value}</span>
                    </div>
                ))}
            </div>

            {/* x402 Payment Required Section */}
            {(proposal.type === 'swap' || proposal.premium) && (
                <div className="m-4 mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={16} className="text-amber-400" />
                            <span className="text-amber-400 font-bold text-xs">x402 PAYMENT REQUIRED</span>
                        </div>
                        <span className="text-amber-300 font-mono text-xs">0.001 USDC</span>
                    </div>
                    <p className="text-[10px] text-amber-300/80 leading-tight">
                        This {proposal.type === 'swap' ? 'optimized swap' : 'premium action'} uses the x402 payment protocol.
                        The swap will execute on-chain via our devnet vault. View the transaction on Solscan after execution.
                    </p>
                </div>
            )}

            {txResult && (
                <div className={`m-4 mt-2 p-3 rounded-xl flex items-start gap-3 ${txResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                    {txResult.success ? (
                        <>
                            <Zap size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                            <div className="text-[10px] text-green-300 leading-tight">
                                <span className="font-bold">Transaction Confirmed!</span>
                                <br />
                                <a
                                    href={`https://solscan.io/tx/${txResult.txId}?cluster=devnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline hover:text-green-200"
                                >
                                    View on Solscan →
                                </a>
                            </div>
                        </>
                    ) : (
                        <>
                            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="text-[10px] text-red-300 leading-tight">
                                <span className="font-bold">Transaction Failed:</span> {txResult.error}
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="p-4 pt-2">
                <Button
                    onClick={handleExecute}
                    disabled={isLoading || txResult?.success}
                    className="w-full font-mono text-xs tracking-wider uppercase group/btn disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <span className="animate-pulse">Processing...</span>
                        </>
                    ) : txResult?.success ? (
                        'Executed ✓'
                    ) : (
                        <>
                            {proposal.premium ? 'Sign & Execute (Premium)' : 'Sign & Execute'}
                            <ChevronRight size={14} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full text-[10px] text-zinc-600 uppercase font-bold mt-3 hover:text-zinc-400 transition-colors"
                >
                    {isExpanded ? 'Hide Technical Details' : 'Show Technical Details'}
                </button>

                {isExpanded && (
                    <div className="mt-3 p-3 bg-black/40 rounded-lg font-mono text-[9px] text-zinc-500 break-all border border-zinc-800/50">
                        {JSON.stringify(proposal.swapParams || proposal.depositParams || { demo: true }, null, 2)}
                    </div>
                )}
            </div>
        </Card>
    );
};
