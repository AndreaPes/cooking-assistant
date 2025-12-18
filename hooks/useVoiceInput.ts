import { useState, useCallback, useRef } from "react";
import { useAssistantState, AssistantStatus } from "@/state/assistantState";

export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { setStatus } = useAssistantState();

  /**
   * Start recording audio from the microphone.
   * MUST be called from a user gesture (click / tap).
   */
  const startListening = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        setStatus(AssistantStatus.PROCESSING);

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        try {
          const formData = new FormData();
          formData.append("file", audioBlob, "speech.webm");

          const res = await fetch("/api/stt", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            throw new Error("STT request failed");
          }

          const data = await res.json();
          setTranscript(data.text || "");
        } catch (err) {
          console.error("STT error:", err);
          setTranscript("");
        } finally {
          setStatus(AssistantStatus.IDLE);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      setTranscript("");
      setIsListening(true);
      setStatus(AssistantStatus.LISTENING);
    } catch (err) {
      console.error("Microphone error:", err);
      setStatus(AssistantStatus.IDLE);
    }
  }, [setStatus]);

  /**
   * Stop recording and trigger transcription.
   */
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
  };
}
