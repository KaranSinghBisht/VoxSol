export interface TTSOptions {
  voiceId?: string;
  workerUrl?: string;
}

const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

export async function playTTS(text: string, options: TTSOptions = {}) {
  const {
    voiceId = DEFAULT_VOICE_ID,
    workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787',
  } = options;

  try {
    const response = await fetch(`${workerUrl}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId }),
    });

    if (!response.ok) {
      throw new Error('TTS request failed');
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    return new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = (err) => {
        URL.revokeObjectURL(audioUrl);
        reject(err);
      };
      audio.play().catch(reject);
    });
  } catch (error) {
    console.error('TTS playback error:', error);
    throw error;
  }
}
