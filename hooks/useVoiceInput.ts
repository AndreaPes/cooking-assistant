import { useState, useCallback, useRef } from "react";
import { useAssistantState, AssistantStatus } from "@/state/assistantState";

/**
 * Custom Hook: useVoiceInput
 * --------------------------
 * Manages the browser's native SpeechRecognition API (Web Speech API).
 * Provides methods to start and stop listening, and exposes the real-time transcript.
 *
 * @returns An object containing:
 * - `isListening`: Boolean indicating if the microphone is active.
 * - `transcript`: The string text captured from the user's speech.
 * - `startListening`: Function to activate the microphone.
 * - `stopListening`: Function to manually stop the microphone (triggers result processing).
 */
export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  // Ref to store the active SpeechRecognition instance
  const recognitionRef = useRef<any>(null);

  const { setStatus } = useAssistantState();

  /**
   * Initializes and starts the Speech Recognition engine.
   */
  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Browser does not support speech recognition.");
      return;
    }

    // Abort any previous instance to prevent conflicts
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Capture one sentence at a time
    recognition.lang = "en-US";
    recognition.interimResults = false;

    // --- Event Handlers ---

    // 1. Microphone Activated
    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setStatus(AssistantStatus.LISTENING);
    };

    // 2. Microphone Deactivated (Silence detected or manual stop)
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
      setStatus(AssistantStatus.IDLE);
    };

    // Store instance and Start
    recognitionRef.current = recognition;
    recognition.start();
  }, [setStatus]);

  /**
   * Manually stops the Speech Recognition engine.
   * This tells the browser "User has finished speaking", which will likely
   * trigger 'onresult' if speech was captured, or 'onend' immediately.
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return { isListening, transcript, startListening, stopListening };
}
