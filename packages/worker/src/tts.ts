import { Context } from 'hono';
import type { Env } from './index';

export async function ttsHandler(c: Context<{ Bindings: Env }>) {
  try {
    const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = await c.req.json();

    if (!text) {
      return c.json({ error: 'Text is required' }, 400);
    }

    if (!c.env.ELEVENLABS_API_KEY) {
      return c.json({ error: 'TTS not configured' }, 503);
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': c.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs error:', error);
      return c.json({ error: 'TTS generation failed' }, 500);
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return c.json({ error: 'TTS processing failed' }, 500);
  }
}
