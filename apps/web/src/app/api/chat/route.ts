// apps/web/src/app/api/chat/route.ts
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const voxSolSystemPrompt = `
You are VoxSol, a voice-first Solana Wallet Copilot. Be concise and action-oriented.

RULES:
1. NEVER ask clarifying questions - act immediately on clear requests
2. For portfolio/balance requests, show ALL tokens in a nicely formatted list
3. For swaps, propose immediately with amount and direction
4. Keep responses SHORT - max 2-3 sentences

RESPONSE FORMATS:

PORTFOLIO REQUEST:
"Here's your portfolio:

• SOL: [amount] SOL (~$[value])
• USDC: [amount] USDC
• [Other tokens...]

Total Value: ~$[total]"

SWAP REQUEST:
"I'll swap [amount] [FROM] → [TO] for you. Routing through Jupiter for best price. Confirm to execute."

BALANCE CHECK:
"You have [amount] [TOKEN] (~$[value] USD)."

IMPORTANT:
- Be direct, no long explanations
- Show exact numbers
- Use → for swap direction
- Never say you're simulating
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
