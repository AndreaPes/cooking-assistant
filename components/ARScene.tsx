"use client";

import { Canvas } from "@react-three/fiber";
import { createXRStore, XR } from "@react-three/xr";
import { OrbitControls } from "@react-three/drei";
import { useState, useEffect, useRef } from "react";

import { useVoiceInput } from "@/hooks/useVoiceInput";
import { InterfaceManager } from "@/components/InterfaceManager";
import { WebcamFeed } from "@/components/WebcamFeed";
import { useCookingState } from "@/state/cookingState";
import {
  useAssistantState,
  AssistantStatus,
  getStatusColor,
} from "@/state/assistantState";
import { useFridgeInventoryState } from "@/state/slices/fridgeInventorySlice";
import { AIResponse } from "@/types/interfaces";
import { detectIngredientsFromImage } from "@/features/fridge-inventory/detectIngredients";

const store = createXRStore({ domOverlay: true });

export default function ARScene() {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Global State
  const { addTimer, removeTimer, clearAllTimers, activeTimers } =
    useCookingState();
  const { status, setStatus } = useAssistantState();

  // Local State
  const [aiState, setAiState] = useState<AIResponse | null>(null);
  const { isListening, transcript, startListening } = useVoiceInput();
  const [isCameraMode, setIsCameraMode] = useState(false);
  const { setFridgeInventory } = useFridgeInventoryState();

  const lastProcessedText = useRef("");

  // --- EFFECT: SYNC VOICE STATUS ---
  useEffect(() => {
    if (isListening) {
      setStatus(AssistantStatus.LISTENING);
    }
  }, [isListening, setStatus]);

  // --- EFFECT: AUTO-SEND ON SILENCE ---
  useEffect(() => {
    if (!isListening && transcript) {
      if (transcript !== lastProcessedText.current) {
        console.log("✅ Silence detected. Sending to Brain...");
        lastProcessedText.current = transcript;
        processVoice();
      }
    }
  }, [isListening, transcript, activeTimers]);

  // --- PROCESS VOICE ---
  const processVoice = async () => {
    if (!transcript) return;
    setStatus(AssistantStatus.PROCESSING);

    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userSpeech: transcript,
          activeTimers: activeTimers,
        }),
      });

      const action = await res.json();
      console.log("🤖 AI Intent:", action);

      // handle interface-based responses (e.g. suggest_recipe)
      if (action.interface || action.type) {
        const uiType = (action.type ?? action.interface) as AIResponse["type"];

        setAiState({
          type: uiType,
          data:
            action.data ??
            {
              text: action.text,
              label: action.label,
              seconds: action.seconds,
            },
          voiceResponse: action.voiceResponse ?? "",
        });

        setStatus(AssistantStatus.IDLE);
        return;
      }

      // Legacy intent-based logic (timers, queries, etc.)
      await handleIntent(action);
      setStatus(AssistantStatus.IDLE);
    } catch (error) {
      console.error("API Error", error);
      setStatus(AssistantStatus.IDLE);
    }
  };

  // --- INTENT ROUTER ---
  const handleIntent = async (action: any) => {
    if (action.intent === "TIMER") {
      if (action.action === "stop") {
        const didRemove = removeTimer(action.label || "");
        if (didRemove) {
          setAiState({
            type: "success",
            data: { label: `Stopped ${action.label}` },
            voiceResponse: "Stopped.",
          });
          setTimeout(() => setAiState(null), 2000);
        } else {
          setAiState({
            type: "error",
            data: { label: `Timer '${action.label}' not found` },
            voiceResponse: "Not found.",
          });
          setTimeout(() => setAiState(null), 2000);
        }
      } else if (action.action === "stop_all") {
        clearAllTimers();
        setAiState({
          type: "success",
          data: { label: "Timers Cleared" },
          voiceResponse: "All stopped.",
        });
        setTimeout(() => setAiState(null), 2000);
      } else {
        addTimer(action.seconds, action.label || "Timer");
      }
    } else if (action.intent === "QUERY") {
      setAiState({
        type: "instruction",
        data: { text: action.answer },
        voiceResponse: "Here is the answer.",
      });
      setTimeout(() => setAiState(null), 6000);
    } else if (action.intent === "FRIDGE_INVENTORY") {
      if (action.action === "hide") {
        // Hide the ingredients box
        setAiState(null);
      } else if (action.action === "scan") {
        if (videoRef.current) {
          setStatus(AssistantStatus.PROCESSING);
          const items = await detectIngredientsFromImage(videoRef.current);
          setFridgeInventory(items);
          setAiState({
            type: "fridge_inventory",
            data: { items },
            voiceResponse: `I detected ${items.length} items.`,
          });
          setStatus(AssistantStatus.IDLE);
        } else {
          setAiState({
            type: "error",
            data: { label: "Camera not available" },
            voiceResponse: "I can't access the camera right now.",
          });
        }
      }
      return;
    }
  };

  const handleMicClick = () => {
    setStatus(AssistantStatus.LISTENING);
    startListening();
  };

  return (
    <div className="h-full w-full relative bg-gray-900">
      {isCameraMode && <WebcamFeed videoRef={videoRef} />}
      <div className="absolute z-10 top-4 right-4 flex flex-col gap-3 items-end">
        <button
          onClick={handleMicClick}
          style={{ backgroundColor: getStatusColor(status) }}
          className={`px-6 py-3 rounded-full font-bold shadow-2xl transition-all scale-100 active:scale-95
                    ${status === AssistantStatus.PROCESSING ? "animate-pulse" : ""}
                    ${status === AssistantStatus.IDLE ? "text-black" : "text-white"} 
                    `}
        >
          {status === AssistantStatus.IDLE && "🎤 Speak"}
          {status === AssistantStatus.LISTENING && "👂 Listening..."}
          {status === AssistantStatus.PROCESSING && "🧠 Thinking..."}
        </button>

        <button
          onClick={() => setIsCameraMode(!isCameraMode)}
          className={`backdrop-blur px-4 py-2 rounded-lg text-sm font-medium transition-all border
                    ${isCameraMode ? "bg-red-500/80 text-white border-red-400" : "bg-white/10 text-white border-white/20 hover:bg-white/20"}`}
        >
          {isCameraMode ? "🚫 Stop Camera" : "📷 Start AR Mode"}
        </button>
      </div>

      <Canvas gl={{ alpha: true }}>
        <OrbitControls makeDefault />
        <XR store={store}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <InterfaceManager activeInterface={aiState} />
        </XR>
      </Canvas>
    </div>
  );
}
