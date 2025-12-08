import { useEffect, useState } from "react";
import { usePorcupine } from "@picovoice/porcupine-react";

const ACCESS_KEY = process.env.NEXT_PUBLIC_PICOVOICE_KEY;

const KEYWORD = {
  publicPath: "/wake_word.ppn",
  label: "Hei Mirage",
  sensitivity: 0.7,
};

const MODEL = {
  publicPath: "/porcupine_params.pv",
};

export function useWakeWord() {
  const { keywordDetection, isLoaded, isListening, error, init, start, stop } =
    usePorcupine();

  const [detected, setDetected] = useState(false);

  // 1. Initialize Porcupine on mount
  useEffect(() => {
    if (ACCESS_KEY) {
      init(ACCESS_KEY, KEYWORD, MODEL).catch((err) =>
        console.error("Porcupine Init Failed:", err),
      );
    }
  }, [init]);

  // 2. Start listening when loaded
  useEffect(() => {
    if (isLoaded && !isListening) {
      start().catch((err) => console.error("Porcupine Start Failed:", err));
      console.log("🦔 Porcupine Listening for 'Hei Mirage'...");
    }
  }, [isLoaded, isListening, start]);

  // 3. Handle keyword detection
  useEffect(() => {
    if (keywordDetection !== null) {
      console.log(`✨ WAKE WORD DETECTED: "${keywordDetection.label}"`);
      setDetected(true);

      const timer = setTimeout(() => setDetected(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [keywordDetection]);

  return { isLoaded, isListening, detected, error };
}
