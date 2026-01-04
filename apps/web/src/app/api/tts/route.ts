import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
// Default voice ID - Rachel (good for assistant-style voices)
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

/**
 * Formats text for TTS output:
 * - Truncates long decimal numbers (0.0190823 → 0.019)
 * - Simplifies large numbers
 * - Makes crypto addresses speakable
 */
function formatTextForTTS(text: string): string {
    // Truncate long decimal numbers
    let formatted = text.replace(/(\d+\.\d{3})\d+/g, '$1');

    // Make long crypto addresses speakable (show first 4 and last 4)
    formatted = formatted.replace(
        /([A-Za-z0-9]{8,})/g,
        (match) => {
            if (match.length > 12) {
                return `${match.slice(0, 4)}...${match.slice(-4)}`;
            }
            return match;
        }
    );

    // Simplify scientific notation
    formatted = formatted.replace(/(\d+)e[+-]?\d+/gi, '$1');

    return formatted;
}

/**
 * Summarizes long AI responses for TTS
 * - Takes the first 2-3 sentences for speaking
 * - Full response is still shown in chat
 */
function summarizeForTTS(text: string, maxLength: number = 300): string {
    // Remove markdown formatting
    let clean = text
        .replace(/#{1,6}\s/g, '') // headers
        .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
        .replace(/\*([^*]+)\*/g, '$1') // italic
        .replace(/`([^`]+)`/g, '$1') // code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
        .replace(/\n+/g, ' ') // newlines
        .trim();

    // Get first few sentences
    const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
    let summary = '';

    for (const sentence of sentences) {
        if (summary.length + sentence.length > maxLength) break;
        summary += sentence;
    }

    return formatTextForTTS(summary || clean.slice(0, maxLength));
}

export async function POST(request: NextRequest) {
    try {
        const { text, voiceId = DEFAULT_VOICE_ID, summarize = true } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
        }

        // Format and optionally summarize the text for TTS
        const spokenText = summarize ? summarizeForTTS(text) : formatTextForTTS(text);

        const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': apiKey,
            },
            body: JSON.stringify({
                text: spokenText,
                model_id: 'eleven_turbo_v2_5',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('ElevenLabs API error:', error);
            return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 });
        }

        // Return audio as blob
        const audioBuffer = await response.arrayBuffer();

        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'no-cache',
            },
        });
    } catch (error) {
        console.error('TTS error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
