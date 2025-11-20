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

// Initialize XR Store with DOM Overlay enabled to keep HTML buttons visible in AR
const store = createXRStore({ domOverlay: true });

export default function ARScene() {
  // Global State
  const {
    activeRecipe,
    currentStepIndex,
    activeTimers,
    nextStep,
    prevStep,
    addToShoppingList,
    getCurrentStepData,
    addTimer,
    removeTimer,
    clearAllTimers,
  } = useCookingState();

  const { status, setStatus } = useAssistantState();

  // Local State
  const [aiState, setAiState] = useState<AIResponse | null>(null);
  const [isCameraMode, setIsCameraMode] = useState(false);
  const { isListening, transcript, startListening } = useVoiceInput();
  const lastProcessedText = useRef("");

  /**
   * Syncs the Voice Input status with the global Assistant Status
   * to drive visual feedback (Button colors).
   */
  useEffect(() => {
    if (isListening) {
      setStatus(AssistantStatus.LISTENING);
    }
  }, [isListening, setStatus]);

  /**
   * Auto-Send Logic:
   * Automatically processes the command when the user stops speaking
   * and a transcript exists.
   */
  useEffect(() => {
    if (
      !isListening &&
      transcript &&
      transcript !== lastProcessedText.current
    ) {
      console.log("✅ Silence detected. Sending to Brain...");
      lastProcessedText.current = transcript;
      processVoice();
    }
  }, [isListening, transcript, activeTimers]);

  /**
   * Recipe Context Engine:
   * Updates the UI based on the current step of the active recipe.
   * Handles automatic safety warnings before showing instructions.
   */
  useEffect(() => {
    if (!activeRecipe) return;

    // Scenario A: Overview (Start)
    if (currentStepIndex === -1) {
      setAiState({
        type: "ingredients",
        data: { items: activeRecipe.ingredients },
        voiceResponse: "Here are your ingredients.",
      });
      return;
    }

    // Scenario B: Active Step
    const stepData = getCurrentStepData();
    if (stepData) {
      // Check for safety warning
      if (stepData.warning) {
        setAiState({
          type: "warning",
          data: { title: "SAFETY ALERT", text: stepData.warning },
          voiceResponse: "Please be careful.",
        });

        // Transition to instruction after 4 seconds
        setTimeout(() => {
          setAiState({
            type: "instruction",
            data: { text: stepData.text, stepNumber: currentStepIndex + 1 },
            voiceResponse: stepData.text,
          });
        }, 4000);
      } else {
        setAiState({
          type: "instruction",
          data: { text: stepData.text, stepNumber: currentStepIndex + 1 },
          voiceResponse: stepData.text,
        });
      }
    }
  }, [currentStepIndex, activeRecipe, getCurrentStepData]);

  /**
   * Handles visual feedback immediately upon button click
   * to reduce perceived latency.
   */
  const handleMicClick = () => {
    setStatus(AssistantStatus.LISTENING);
    startListening();
  };

  /**
   * Sends the user's speech to the AI API.
   */
  const processVoice = async () => {
    if (!transcript) return;

    setStatus(AssistantStatus.PROCESSING);
    console.log("Sending: ", transcript);

    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        body: JSON.stringify({
          userSpeech: transcript,
          currentStepIndex,
          recipeTitle: activeRecipe?.title,
          activeTimers: activeTimers,
        }),
      });

      const action = await res.json();
      console.log("🤖 AI Intent:", action);

      handleIntent(action);
      setStatus(AssistantStatus.IDLE);
    } catch (error) {
      console.error("API Error", error);
      setStatus(AssistantStatus.IDLE);
    }
  };

  /**
   * Routes the AI's JSON response to specific application actions.
   */
  const handleIntent = (action: any) => {
    // Navigation Logic
    if (action.intent === "NAVIGATE") {
      if (action.direction === "next") nextStep();
      if (action.direction === "prev") prevStep();
    }
    // Timer Logic
    else if (action.intent === "TIMER") {
      if (action.action === "stop") {
        const didRemove = removeTimer(action.label || "");
        if (didRemove) {
          setAiState({
            type: "success",
            data: { label: `Stopped ${action.label}` },
            voiceResponse: "Stopped.",
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
        // Start Timer (Silent visual add)
        addTimer(action.seconds, action.label || "Timer");
      }
    }
    // Shopping List Logic
    else if (action.intent === "SHOPPING" && action.action === "add") {
      addToShoppingList(action.item);
      setAiState({
        type: "success",
        data: { label: `Added ${action.item}` },
        voiceResponse: "Added to list.",
      });
    }
    // Show Ingredients Logic
    else if (action.intent === "SHOW_INGREDIENTS") {
      setAiState({
        type: "ingredients",
        data: { items: activeRecipe?.ingredients },
        voiceResponse: "Here is the list.",
      });
    }
    // General Query Logic
    else if (action.intent === "QUERY") {
      setAiState({
        type: "instruction",
        data: { text: action.answer, stepNumber: 0 },
        voiceResponse: "Here is the answer.",
      });
      setTimeout(() => {
        setAiState((currentState) => {
          if (currentState?.data.text === action.answer) {
            return null;
          }
          return currentState;
        });
      }, 6000);
    }
  };

  return (
    <div className="h-full w-full relative bg-gray-900">
      {/* Background: Webcam Feed (Only if Camera Mode is ON) */}
      {isCameraMode && <WebcamFeed />}

      {/* UI Overlay: Buttons & Status */}
      <div className="absolute z-10 top-4 right-4 flex flex-col gap-3 items-end">
        {/* Speak Button */}
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

        {/* AR Mode Toggle */}
        <button
          onClick={() => setIsCameraMode(!isCameraMode)}
          className={`backdrop-blur px-4 py-2 rounded-lg text-sm font-medium transition-all border
                    ${
                      isCameraMode
                        ? "bg-red-500/80 text-white border-red-400"
                        : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                    }`}
        >
          {isCameraMode ? "🚫 Stop Camera" : "📷 Start AR Mode"}
        </button>
      </div>

      {/* 3D Scene Layer */}
      <Canvas gl={{ alpha: true }}>
        <OrbitControls makeDefault />

        <XR store={store}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />

          {/* Manages rendering of Timers, Instructions, and Alerts */}
          <InterfaceManager activeInterface={aiState} />
        </XR>
      </Canvas>
    </div>
  );
}
