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
import { AIResponse, AtomicStep } from "@/types/interfaces";
import { useShoppingState } from "@/state/shoppingState";
import { detectIngredientsFromImage } from "@/features/fridge-inventory/detectIngredients";

const store = createXRStore({ domOverlay: true });

export default function ARScene() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // --- GLOBAL STATE ---
  const {
    loadRecipe,
    nextStep,
    prevStep,
    jumpToStep,
    setSuggestion,
    addTimer,
    startTimer,
    removeTimerById,
    clearAllTimers,
    stopCooking,
  } = useCookingState();

  const { status, setStatus } = useAssistantState();
  const { setFridgeInventory } = useFridgeInventoryState();
  const { addItem: addShopItem, showAll } = useShoppingState();

  // --- LOCAL STATE ---
  const [aiState, setAiState] = useState<AIResponse | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { isListening, transcript, startListening } = useVoiceInput();
  const [isCameraMode, setIsCameraMode] = useState(true);
  const lastProcessedText = useRef("");

  /**
   * Helper: Timer Spawner
   * Acts as an orchestrator to spawn timers required by specific recipe steps.
   * Timers are created in 'idle' mode (autoStart=false), waiting for user confirmation.
   */
  const checkAndSpawnTimer = (step: AtomicStep) => {
    if (step && step.timerSeconds && step.timerSeconds > 0) {
      addTimer(step.timerSeconds, step.actionVerb, false, step.id);
      setToastMessage(`Timer ready: ${step.actionVerb}`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // --- VOICE & API EFFECTS ---

  // Sync assistant status with voice input state
  useEffect(() => {
    if (isListening) setStatus(AssistantStatus.LISTENING);
  }, [isListening, setStatus]);

  // Trigger processing on silence detection
  useEffect(() => {
    if (!isListening && transcript) {
      if (transcript !== lastProcessedText.current) {
        lastProcessedText.current = transcript;
        console.log("🎤 Processing transcript:", transcript);
        processVoice().catch(console.error);
      }
    }
  }, [isListening, transcript]);

  /**
   * Main Logic: Process Voice Input
   * Captures the current application state (Fridge, Recipes, Timers) and sends it
   * to the AI backend to determine the user's intent.
   */
  const processVoice = async () => {
    if (!transcript) return;
    setStatus(AssistantStatus.PROCESSING);

    try {
      const freshState = useCookingState.getState();
      const freshFridge = useFridgeInventoryState.getState().fridgeItems;

      let previewRecipe = null;
      if (
        freshState.suggestion?.recipes &&
        freshState.selectedSuggestionIndex !== null &&
        freshState.selectedSuggestionIndex >= 0
      ) {
        previewRecipe =
          freshState.suggestion.recipes[freshState.selectedSuggestionIndex];
      }

      const payload = {
        userSpeech: transcript,
        activeTimers: freshState.activeTimers,
        fridgeItems: freshFridge ?? [],
        currentRecipes: freshState.suggestion?.recipes || [],
        selectedRecipe: previewRecipe,
        activeRecipe: freshState.activeRecipe
          ? {
              title: freshState.activeRecipe.recipeTitle,
              steps: freshState.activeRecipe.steps,
              currentStepIndex: freshState.currentStepIndex,
            }
          : null,
      };

      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const action = await res.json();
      console.log("🤖 AI Response:", action);
      await handleAIResponse(action);
    } catch (error) {
      console.error("API Error", error);
      setToastMessage("Connection Error");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setStatus(AssistantStatus.IDLE);
      setTimeout(() => {
        lastProcessedText.current = "";
      }, 1000);
    }
  };

  /**
   * Response Dispatcher
   * Routes the AI's intent to the appropriate state slice actions.
   */
  const handleAIResponse = async (action: any) => {
    const intentType = action.intent || action.type || action.interface;

    // 1. GENERATE / START COOKING
    if (intentType === "GENERATE_RECIPE") {
      if (action.recipe) {
        loadRecipe(action.recipe);
        setAiState(null);
        setSuggestion(null);

        jumpToStep(0);

        if (action.recipe.steps?.length > 0) {
          checkAndSpawnTimer(action.recipe.steps[0]);
        }
      }
      return;
    }

    // 2. NAVIGATE STEPS
    if (intentType === "NAVIGATE") {
      const dir = action.direction?.toLowerCase();
      const target = action.target;

      console.log(`Executing Navigation: dir=${dir} (target=${target})`);

      if (dir === "next") nextStep();
      else if (dir === "prev" || dir === "previous") prevStep();
      else if (dir === "jump" || dir === "last" || dir === "first") {
        if (target === "first" || dir === "first") jumpToStep(0);
        else if (target === "last" || dir === "last") {
          const currentRecipe = useCookingState.getState().activeRecipe;
          if (currentRecipe?.steps) jumpToStep(currentRecipe.steps.length);
        } else if (typeof target === "number")
          jumpToStep(Math.max(0, target - 1));
      }

      setTimeout(() => {
        const updatedState = useCookingState.getState();
        const newIndex = updatedState.currentStepIndex;
        const steps = updatedState.activeRecipe?.steps;

        if (updatedState.activeRecipe && steps && newIndex === steps.length) {
          setToastMessage("Recipe Completed! 🎉");
          setTimeout(() => setToastMessage(null), 4000);
        } else if (steps && steps[newIndex])
          checkAndSpawnTimer(steps[newIndex]);
      }, 50);

      return;
    }

    // 3. RECIPE SUGGESTIONS
    if (intentType === "SUGGEST_RECIPE") {
      const incomingData = action.data || {};
      const currentRecipes =
        useCookingState.getState().suggestion?.recipes || [];
      const newRecipes =
        incomingData.recipes?.length > 0
          ? incomingData.recipes
          : currentRecipes;

      if (useCookingState.getState().activeRecipe) {
        stopCooking();
      }
      setAiState({
        type: "suggest_recipe",
        data: { ...incomingData, recipes: newRecipes },
      });
      setSuggestion({ recipes: newRecipes });
      return;
    }

    // 4. TIMERS
    if (intentType === "TIMER") {
      // CASE A: Start an EXISTING idle timer
      if (action.action === "start_existing" && action.id) {
        startTimer(action.id);
        setTimeout(() => setToastMessage(null), 3000);
      }
      // CASE B: Create a NEW timer
      else if (action.action === "start") {
        const label = action.label || "Timer";
        const seconds = action.seconds || 0;
        addTimer(seconds, label, true);
        setTimeout(() => setToastMessage(null), 3000);
      }
      // CASE C: STOP specific timer
      else if (action.action === "stop") {
        if (action.id) {
          removeTimerById(action.id);
        } else {
          console.warn("AI didn't provide ID for stop action");
        }
        setTimeout(() => setToastMessage(null), 3000);
      }
      // CASE D: STOP ALL
      else if (action.action === "stop_all") {
        clearAllTimers();
        setToastMessage("All timers cleared");
        setTimeout(() => setToastMessage(null), 3000);
      }
      return;
    }

    // 5. SHOPPING
    if (intentType === "SHOPPING_LIST") {
      if (action.action === "add") {
        await addShopItem(action.label || action.item, action.quantity || 1);
        setToastMessage("Added to list");
        setTimeout(() => setToastMessage(null), 3000);
      } else if (action.action === "show") {
        await showAll();
        setAiState({ type: "shopping_list", data: { label: "Shopping" } });
      }
      return;
    }

    // 6. FRIDGE INVENTORY
    if (intentType === "FRIDGE_INVENTORY") {
      if (action.action === "scan" && videoRef.current) {
        setToastMessage("Scanning Fridge...");
        const items = await detectIngredientsFromImage(videoRef.current);
        setFridgeInventory(items);
        setAiState({ type: "fridge_inventory", data: { fridgeItems: items } });
        setToastMessage(null);
      } else if (action.action === "hide") {
        setAiState(null);
      }
      return;
    }

    // Fallback UI
    if (action.interface || action.type) {
      setAiState({
        type: (action.type ?? action.interface) as AIResponse["type"],
        data: action.data,
      });
    }
  };

  const handleMicClick = () => {
    setStatus(AssistantStatus.LISTENING);
    startListening();
  };

  return (
    <div className="h-full w-full relative bg-gray-900">
      {isCameraMode && <WebcamFeed />}

      {/* --- UI OVERLAY BUTTONS --- */}
      <div className="absolute z-10 top-4 right-4">
        <button
          onClick={handleMicClick}
          style={{ backgroundColor: getStatusColor(status) }}
          className={`px-6 py-3 rounded-full font-bold shadow-2xl text-black ${
            status === AssistantStatus.PROCESSING ? "animate-pulse" : ""
          }`}
        >
          {status === AssistantStatus.IDLE ? "Speak" : status}
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

          {/* InterfaceManager handles all 3D UI rendering logic */}
          <InterfaceManager
            activeInterface={aiState}
            toastMessage={toastMessage}
          />
        </XR>
      </Canvas>
    </div>
  );
}
