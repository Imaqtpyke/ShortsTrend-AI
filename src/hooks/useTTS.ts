import { useState, useEffect, useCallback } from 'react';

export function useTTS() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeText, setActiveText] = useState<string | null>(null);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const speak = useCallback((text: string) => {
        if (!('speechSynthesis' in window)) {
            console.warn('Text-to-speech not supported in this browser.');
            return;
        }

        // Stop any current speech
        window.speechSynthesis.cancel();

        if (activeText === text && isPlaying) {
            setIsPlaying(false);
            setActiveText(null);
            return; // Toggle off
        }

        const utterance = new SpeechSynthesisUtterance(text);

        // Try to get a good English voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
            || voices.find(v => v.lang.startsWith('en'));

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        // Slightly faster pacing for shorts
        utterance.rate = 1.1;

        utterance.onstart = () => {
            setIsPlaying(true);
            setActiveText(text);
        };

        utterance.onend = () => {
            setIsPlaying(false);
            setActiveText(null);
        };

        utterance.onerror = () => {
            setIsPlaying(false);
            setActiveText(null);
        };

        window.speechSynthesis.speak(utterance);
    }, [activeText, isPlaying]);

    const stop = useCallback(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            setActiveText(null);
        }
    }, []);

    return { speak, stop, isPlaying, activeText };
}
