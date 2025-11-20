import { useState, useCallback } from "react";

export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  // Initialize speech recognition logic
  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Browser does not support speech recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";

    // --- Event Handlers ---

    // 1. Microphone Activated
    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };

    // 2. Microphone Deactivated (Silence detected)
    recognition.onend = () => {
      setIsListening(false);
    };

    // 3. Transcription Received
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
    };

    // 4. Error Handling
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    // Begin recording
    recognition.start();
  }, []);

  return { isListening, transcript, startListening };
}
