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
import { AIResponse } from "@/types/interfaces";
import { useShoppingState } from "@/state/shoppingState";

const store = createXRStore({ domOverlay: true });

export default function ARScene() {
  // Global State
  const { addTimer, removeTimer, clearAllTimers, activeTimers } =
    useCookingState();
  const { status, setStatus } = useAssistantState();

  // Local State
  const [aiState, setAiState] = useState<AIResponse | null>(null);
  const { isListening, transcript, startListening } = useVoiceInput();
  const [isCameraMode, setIsCameraMode] = useState(false);

  // Shopping store actions
  const { addItem: addShopItem, removeItem: removeShopItem, clearAll: clearShopping, showAll } = useShoppingState();

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
        body: JSON.stringify({
          userSpeech: transcript,
          activeTimers: activeTimers,
        }),
      });

      const action = await res.json();
      console.log("🤖 AI Intent:", action);

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
        const didRemove = await removeTimer(action.label || "");
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

    } else if (action.intent === "SHOPPING_LIST") {
      // Actions: add, remove, clear, show
      if (action.action === "add") {
        console.log("Adding shopping item:", action);
        // AI may return the item under `item` or `label` depending on the prompt/schema.
        const itemLabel = action.label ?? action.item ?? null;
        if (itemLabel) {
          // Use quantity from the AI when provided, default to 1
          addShopItem(itemLabel, action.quantity ?? 1);
          // Show a short success notification instead of the full list
          const qtyText = action.quantity ? ` × ${action.quantity}` : "";
          setAiState({
            type: "success",
            data: { label: `Added ${itemLabel}${qtyText}` },
            voiceResponse: `Added ${itemLabel}`,
          });
          setTimeout(() => setAiState(null), 6000);
        }
      } else if (action.action === "remove") {
        const removeLabel = action.label ?? action.item ?? "";
        const didRemove = await removeShopItem(removeLabel);
        if (didRemove) {
          setAiState({
            type: "success",
            data: { label: `Removed ${removeLabel}` },
            voiceResponse: `Removed ${removeLabel}`,
          });
        } else {
          setAiState({
            type: "error",
            data: { label: `Item not found: ${removeLabel}` },
            voiceResponse: `Item not found`,
          });
        }
        setTimeout(() => setAiState(null), 6000);
      } else if (action.action === "clear") {
        clearShopping();
        setAiState({
          type: "success",
          data: { label: "Shopping list cleared" },
          voiceResponse: "Cleared shopping list",
        });
        setTimeout(() => setAiState(null), 6000);
      } else if (action.action === "show") {
        // Fetch the latest items from the backend and show the full shopping list UI
        try {
          await showAll();
        } catch (err) {
          console.error('showAll failed', err);
        }

        setAiState({
          type: "shopping_list",
          data: { label: "Shopping" },
          voiceResponse: "Showing shopping list",
        });
        setTimeout(() => setAiState(null), 6000);
      }
    }
  };

  const handleMicClick = () => {
    setStatus(AssistantStatus.LISTENING);
    startListening();
  };

  return (
    <div className="h-full w-full relative bg-gray-900">
      {isCameraMode && <WebcamFeed />}

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
