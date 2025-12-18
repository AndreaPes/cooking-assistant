import { useEffect, useState } from "react";
import { usePorcupine } from "@picovoice/porcupine-react";

/**
 * Picovoice Access Key retrieved from environment variables.
 * Required to initialize the Porcupine engine.
 */
const ACCESS_KEY = process.env.NEXT_PUBLIC_PICOVOICE_KEY;

/**
 * Configuration for the wake word detection.
 * Defines the sensitivity and the specific keyword file to look for.
 */
const KEYWORD = {
  publicPath: "/wake_word.ppn",
  label: "Hey Mira",
  sensitivity: 0.7,
};

/**
 * Configuration for the Porcupine model parameters.
 */
const MODEL = {
  publicPath: "/porcupine_params.pv",
};

/**
 * Custom Hook: useWakeWord
 * ------------------------
 * Manages the local wake word detection using the Picovoice Porcupine engine.
 * It initializes the engine, manages the microphone stream, and flags when the keyword is detected.
 *
 * @returns An object containing:
 * - `isLoaded`: Boolean indicating if the model is ready.
 * - `isListening`: Boolean indicating if the microphone is currently active.
 * - `detected`: Boolean flag that briefly turns true when the wake word is spoken.
 * - `error`: Error object if initialization fails.
 */
export function useWakeWord() {
  const { keywordDetection, isLoaded, isListening, error, init, start, stop } =
    usePorcupine();

  const [detected, setDetected] = useState(false);

  // Initialize Porcupine on mount
  useEffect(() => {
    if (ACCESS_KEY) {
      init(ACCESS_KEY, KEYWORD, MODEL).catch((err) =>
        console.error("Porcupine Init Failed:", err),
      );
    }
  }, [init]);

  // Start listening automatically when the model is loaded
  useEffect(() => {
    if (isLoaded && !isListening) {
      start().catch((err) => console.error("Porcupine Start Failed:", err));
      console.log("🦔 Porcupine Listening for 'Hey Mira'...");
    }
  }, [isLoaded, isListening, start]);

  // Handle keyword detection events
  useEffect(() => {
    if (keywordDetection !== null) {
      console.log(`✨ WAKE WORD DETECTED: "${keywordDetection.label}"`);
      setDetected(true);

      // Reset the detected flag after 1 second to allow subsequent triggers
      const timer = setTimeout(() => setDetected(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [keywordDetection]);

  return { isLoaded, isListening, detected, error };
}
