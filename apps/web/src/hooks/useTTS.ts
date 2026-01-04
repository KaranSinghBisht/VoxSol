'use client';

import { useState, useRef, useCallback } from 'react';

interface UseTTSOptions {
    voiceId?: string;
    summarize?: boolean;
}

export function useTTS(options: UseTTSOptions = {}) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const speak = useCallback(async (text: string) => {
        if (!text.trim()) return;

        // Stop any ongoing speech
        stop();

        setIsLoading(true);
        setError(null);

        try {
            abortControllerRef.current = new AbortController();

            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    voiceId: options.voiceId,
                    summarize: options.summarize ?? true,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                throw new Error('TTS request failed');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            if (audioRef.current) {
                audioRef.current.pause();
                URL.revokeObjectURL(audioRef.current.src);
            }

            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onplay = () => setIsSpeaking(true);
            audio.onended = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
            };
            audio.onerror = () => {
                setIsSpeaking(false);
                setError('Audio playback failed');
                URL.revokeObjectURL(audioUrl);
            };

            await audio.play();
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('TTS error:', err);
                setError(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    }, [options.voiceId, options.summarize]);

    const stop = useCallback(() => {
        // Cancel ongoing fetch
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // Stop audio playback
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }

        setIsSpeaking(false);
        setIsLoading(false);
    }, []);

    return {
        speak,
        stop,
        isSpeaking,
        isLoading,
        error,
    };
}
