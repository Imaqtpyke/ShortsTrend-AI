import { useState, useEffect, useCallback, useRef } from 'react';

export function useTTS() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeText, setActiveText] = useState<string | null>(null);
    // BUG FIX #4: Cache voices in a ref to survive re-renders without re-calling getVoices().
    // Chrome loads voices asynchronously — getVoices() returns [] on first call until
    // the voiceschanged event fires. Without this, TTS always uses the browser default voice.
    const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        const loadVoices = () => {
            voicesRef.current = window.speechSynthesis.getVoices();
        };
        // Load immediately in case they're already available (Firefox / Safari)
        loadVoices();
        // Also listen for async load (required for Chrome)
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
        return () => {
            window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
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

        // Use cached voices to avoid the Chrome race condition
        const voices = voicesRef.current;
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
