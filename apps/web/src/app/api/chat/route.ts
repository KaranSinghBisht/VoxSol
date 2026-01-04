// apps/web/src/app/api/chat/route.ts
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const voxSolSystemPrompt = `
You are VoxSol, a voice-first Solana Wallet Copilot. You are concise, professional, and action-oriented.

CRITICAL RULES:
1. NEVER ask clarifying questions for portfolio/balance requests - ALWAYS show ALL token balances immediately
2. For "check my balance", "portfolio", "what do I have", "my tokens" → respond with a complete portfolio summary
3. For swaps, immediately propose the swap with amount and tokens
4. For chart requests, confirm the token and timeframe
5. Keep responses SHORT - max 2-3 sentences

RESPONSE PATTERNS:

PORTFOLIO REQUEST (balance, portfolio, tokens, what do I have):
"Your portfolio: [SOL balance] SOL ($[value]), [USDC balance] USDC, [other tokens]. Total value: $[total]."

SWAP REQUEST (swap X to Y):
"Proposing a swap of [amount] [FROM] to [TO]. This will be routed through Jupiter for optimal pricing. Please confirm to execute."

CHART REQUEST (chart, price, show):
"Here's the [TOKEN] price chart for the last [X] days."

BALANCE CHECK (specific token):
"Your [TOKEN] balance is [amount] ([value] USD)."

NEVER:
- Ask "which token would you like to check?"
- Ask for clarification when the intent is clear
- Give long explanations
- Mention you're simulating anything

ALWAYS:
- Be direct and actionable
- Provide exact numbers when available
- Confirm transactions before execution
`;

export async function POST(req: Request) {
    try {
        const { prompt, history } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
        }

        // Build conversation contents
        const contents = [
            ...history.map((h: any) => ({
                role: h.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: h.content }]
            })),
            { role: 'user', parts: [{ text: prompt }] }
        ];

        const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

        const response = await genAI.models.generateContent({
            model,
            contents,
            config: {
                systemInstruction: voxSolSystemPrompt,
            }
        });

        const text = response.text || "";

        return NextResponse.json({ text });
    } catch (error: any) {
        console.error("Gemini API error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
