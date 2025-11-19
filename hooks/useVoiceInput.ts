import { useState, useCallback } from 'react';

export function useVoiceInput() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');

    // Initialize speech recognition
    const startListening = useCallback(() => {
        if (typeof window === 'undefined') return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Browser does not support speech recognition.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';

        // 2. Use the specific type we defined to satisfy ESLint
        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const text = event.results[0][0].transcript;
            setTranscript(text);
        };

        // Optional: Handle errors cleanly
        recognition.onerror = (event: SpeechRecognitionError) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognition.start();
    }, []);

    return { isListening, transcript, startListening };
}