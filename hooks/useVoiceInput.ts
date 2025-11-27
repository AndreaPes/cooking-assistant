import { useState, useCallback } from "react";
import { useAssistantState, AssistantStatus } from "@/state/assistantState";
import { useCookingState } from "@/state/cookingState";
import type { AIResponse, InterfaceType } from "@/types/interfaces";

export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const { setStatus, setActiveInterface } = useAssistantState();
  const { activeTimers } = useCookingState();

  // Send final text to /api/assist and update activeInterface
  const sendToAssistant = useCallback(
    async (finalText: string) => {
      try {
        setStatus(AssistantStatus.PROCESSING);

        const res = await fetch("/api/assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userSpeech: finalText,
            activeTimers,
          }),
        });

        const content = await res.json();
        console.log("Frontend AI content:", content);

        const typeValue = (content.type ??
          content.intent ??
          content.interface) as InterfaceType;

        const ai: AIResponse = {
          type: typeValue,               // "suggest_recipe", "timer", etc.
          data: content.data ?? {},      // recipe / timer / notification data
          voiceResponse: content.voiceResponse ?? "",
        };

        setActiveInterface(ai);
        setStatus(AssistantStatus.SPEAKING);
      } catch (err) {
        console.error("Assistant error:", err);
        setStatus(AssistantStatus.IDLE);
      }
    },
    [activeTimers, setActiveInterface, setStatus],
  );

  // Initialize speech recognition logic
  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

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
      setStatus(AssistantStatus.LISTENING);
    };

    // 2. Microphone Deactivated (Silence detected)
    recognition.onend = () => {
      setIsListening(false);
      // we don’t change status here; it will change after API call
    };

    // 3. Transcription Received
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      // 🔑 call backend with the final transcript
      sendToAssistant(text);
    };

    // 4. Error Handling
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      setStatus(AssistantStatus.IDLE);
    };

    // Begin recording
    recognition.start();
  }, [sendToAssistant, setStatus]);

  return { isListening, transcript, startListening };
}
