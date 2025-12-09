"use client";

import { Canvas } from "@react-three/fiber";
import { createXRStore, XR } from "@react-three/xr";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";

import { useVoiceInput } from "@/hooks/useVoiceInput";
import { InterfaceManager } from "@/components/InterfaceManager";
import { WebcamFeed } from "@/components/WebcamFeed";

import { useCookingState } from "@/state/cookingState";
import { AssistantStatus, useAssistantState } from "@/state/assistantState";
import { useFridgeInventoryState } from "@/state/slices/fridgeInventorySlice";
import { AIResponse, AtomicStep } from "@/types/interfaces";
import { useShoppingState } from "@/state/shoppingState";
import { detectIngredientsFromImage } from "@/features/fridge-inventory/detectIngredients";
import { useWakeWord } from "@/hooks/useWakeWord";

const store = createXRStore({ domOverlay: true });

export default function ARScene() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // --- GLOBAL STATE ---
  const { detected: wakeWordDetected } = useWakeWord();

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
  const { addFridgeItems, removeFridgeItems, clearFridgeInventory } =
    useFridgeInventoryState();
  const {
    addItem: addShopItem,
    showAll,
    removeItem: removeShopItem,
    clearAll: clearShopList,
  } = useShoppingState();

  // --- LOCAL STATE ---
  const [aiState, setAiState] = useState<AIResponse | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { isListening, transcript, startListening } = useVoiceInput();
  const [isCameraMode, setIsCameraMode] = useState(true);

  const lastProcessedText = useRef("");
  const isProcessingRef = useRef(false);

  /**
   * Helper: Timer Spawner
   * Acts as an orchestrator to spawn timers required by specific recipe steps.
   * Timers are created in 'idle' mode (autoStart=false), waiting for user confirmation.
   */
  const checkAndSpawnTimer = (step: AtomicStep) => {
    if (step && step.timerSeconds && step.timerSeconds > 0) {
      addTimer(step.timerSeconds, step.actionVerb, false, step.id);
    }
  };

  // --- VOICE & API EFFECTS ---

  // Trigger listening on wake word detection
  useEffect(() => {
    if (
      wakeWordDetected &&
      status === AssistantStatus.IDLE &&
      !isProcessingRef.current &&
      !isListening
    ) {
      console.log("Triggering listening due to wake word");
      handleMicClick();
    }
  }, [wakeWordDetected, status]);

  // Sync assistant status with voice input state
  useEffect(() => {
    if (isListening) setStatus(AssistantStatus.LISTENING);
  }, [isListening, setStatus]);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger processing on silence detection
  useEffect(() => {
    if (!isListening && transcript && !isProcessingRef.current) {
      const cleanTranscript = transcript.trim();

      if (cleanTranscript !== lastProcessedText.current) {
        setStatus(AssistantStatus.PROCESSING);

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          if (!isProcessingRef.current) {
            console.log("🎤 DEBOUNCED TRIGGER:", cleanTranscript);
            lastProcessedText.current = cleanTranscript;
            processVoice(cleanTranscript);
          }
        }, 500);
      }
    }
  }, [isListening, transcript]);

  /**
   * Main Logic: Process Voice Input
   * Captures the current application state (Fridge, Recipes, Timers) and sends it
   * to the AI backend to determine the user's intent.
   */
  const processVoice = async (textToProcess: string) => {
    if (!textToProcess) return;

    isProcessingRef.current = true;
    setStatus(AssistantStatus.PROCESSING);
    console.log("Processing Single Request:", transcript);

    try {
      const freshState = useCookingState.getState();
      const freshFridge = useFridgeInventoryState.getState().fridgeItems;
      const freshShopping = useShoppingState.getState().items;

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
        userSpeech: textToProcess,
        activeTimers: freshState.activeTimers,
        fridgeItems: freshFridge ?? [],
        shoppingList: freshShopping ?? [],
        currentRecipes: freshState.suggestion?.recipes || [],
        selectedRecipe: previewRecipe,
        activeRecipe: freshState.activeRecipe
          ? {
              title: freshState.activeRecipe.title,
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
      setTimeout(() => {
        setStatus(AssistantStatus.IDLE);
        isProcessingRef.current = false;
      }, 500);
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
      setAiState(null);
      setSuggestion(null);

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
          setToastMessage("Recipe Completed!");
          setTimeout(() => {
            setToastMessage(null);
            stopCooking();
            console.log("🧹 Recipe state cleared.");
          }, 4000);
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
      const hasNewRecipes =
        incomingData.recipes && incomingData.recipes.length > 0;

      const recipesToSet = hasNewRecipes
        ? incomingData.recipes
        : currentRecipes;

      const newData = {
        ...incomingData,
        recipes: recipesToSet,
        selectedTitle: incomingData.selectedTitle,
      };

      setAiState({ type: "suggest_recipe", data: newData });
      setSuggestion(newData);
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
      }
      return;
    }

    // 5. SHOPPING LIST
    if (intentType === "SHOPPING_LIST") {
      const label = action.label || action.item || "";

      // ADD
      if (action.action === "add") {
        await addShopItem(label, action.quantity || 1);
        setToastMessage(`Added ${label}`);
      }
      // SHOW
      else if (action.action === "show") {
        await showAll();
        setAiState({ type: "shopping_list", data: { label: "Shopping List" } });
      }
      // REMOVE
      else if (action.action === "remove") {
        await removeShopItem(label);
        setToastMessage(`Removed from list: ${label}`);
      }
      // CLEAR
      else if (action.action === "clear") {
        await clearShopList();
        setToastMessage("Shopping list cleared");
      }

      // HIDE
      else if (action.action === "hide") {
        setAiState(null);
      }
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    // 6. FRIDGE INVENTORY
    if (intentType === "FRIDGE_INVENTORY") {
      // Visual Scan
      if (action.action === "scan" && videoRef.current) {
        setToastMessage("📸 Analyzing Fridge...");
        const newScannedItems = await detectIngredientsFromImage(
          videoRef.current,
        );

        if (newScannedItems.length > 0) {
          addFridgeItems(newScannedItems);
          const updatedList = useFridgeInventoryState.getState().fridgeItems;

          setAiState({
            type: "fridge_inventory",
            data: { fridgeItems: updatedList },
          });
          setToastMessage(
            `Scan complete. Found ${newScannedItems.length} items.`,
          );
        } else {
          setToastMessage("No food detected 🤷‍♂️");
        }
        setTimeout(() => setToastMessage(null), 3000);
      }

      // Manual Voice Add
      else if (action.action === "add_manual" && action.items) {
        addFridgeItems(action.items);
        const updatedList = useFridgeInventoryState.getState().fridgeItems;

        setAiState({
          type: "fridge_inventory",
          data: { fridgeItems: updatedList },
        });
      }

      // Hide Inventory
      else if (action.action === "hide") {
        setAiState(null);
        setToastMessage("Inventory hidden");
        setTimeout(() => setToastMessage(null), 2000);
      }

      // Manual Voice Remove
      else if (action.action === "remove_manual" && action.items) {
        removeFridgeItems(action.items);
        const freshList = useFridgeInventoryState.getState().fridgeItems;

        console.log("Updates List after remove:", freshList);

        setToastMessage(`Removed items`);
        setAiState({
          type: "fridge_inventory",
          data: { fridgeItems: [...freshList] },
        });
        setTimeout(() => setToastMessage(null), 3000);
      }

      // Clear Inventory
      else if (action.action === "clear") {
        clearFridgeInventory();
        setAiState({
          type: "fridge_inventory",
          data: { fridgeItems: [] },
        });
      }

      return;
    }

    // 7, GENERIC QUERY
    if (intentType === "QUERY") {
      if (action.answer) {
        setAiState({
          type: "instruction",
          data: { text: action.answer },
        });
        setTimeout(() => setAiState(null), 9000);
      }
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
    if (status === AssistantStatus.PROCESSING || isListening) return;
    lastProcessedText.current = "";
    setStatus(AssistantStatus.LISTENING);
    startListening();
  };

  // --- MIC DYNAMIC STYLES ---
  const getMicStyles = () => {
    switch (status) {
      case AssistantStatus.LISTENING:
        return "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse scale-110";
      case AssistantStatus.PROCESSING:
        return "bg-yellow-400 text-black shadow-[0_0_30px_rgba(250,204,21,0.6)] animate-spin-slow";
      default: // IDLE
        return "bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-md";
    }
  };

  return (
    <div className="h-full w-full relative bg-gray-900">
      {isCameraMode && <WebcamFeed videoRef={videoRef} />}

      {/* --- UI CONTROLS (TOP RIGHT) --- */}
      <div className="absolute z-50 top-6 right-6 flex items-center gap-6">
        {/* 1. CAMERA TOGGLE */}
        <button
          onClick={() => setIsCameraMode(!isCameraMode)}
          className={`
            w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out shadow-lg
            ${isCameraMode ? "bg-green-500" : "bg-gray-600/80 backdrop-blur"}
          `}
          aria-label="Toggle Camera"
        >
          <div
            className={`
              w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-[cubic-bezier(0.4,0.0,0.2,1)]
              ${isCameraMode ? "translate-x-6" : "translate-x-0"}
            `}
          />
        </button>

        {/* 2. MICROPHONE */}
        <button
          onClick={handleMicClick}
          className={`
            w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl
            ${getMicStyles()}
          `}
          aria-label="Activate Voice"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={`w-8 h-8 transition-transform duration-300 ${status === AssistantStatus.LISTENING ? "scale-110" : "scale-100"}`}
          >
            <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
            <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 9.303V21a.75.75 0 0 1-1.5 0v-2.197A6.751 6.751 0 0 1 5.25 12.75v-1.5a.75.75 0 0 1 .75-.75Z" />
          </svg>
        </button>
      </div>

      {/* SUBTITLES */}
      {(transcript || isListening) && (
        <div className="absolute bottom-12 left-0 w-full flex justify-center z-40 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 text-white px-8 py-4 rounded-3xl text-xl font-medium shadow-2xl max-w-[85%] text-center">
            {transcript ? (
              <span>&quot;{transcript}&quot;</span>
            ) : (
              <span className="text-white/50 italic">Listening...</span>
            )}
          </div>
        </div>
      )}

      {/* AR SCENE */}
      <Canvas gl={{ alpha: true }}>
        <OrbitControls makeDefault />
        <XR store={store}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <InterfaceManager
            activeInterface={aiState}
            toastMessage={toastMessage}
          />
        </XR>
      </Canvas>
    </div>
  );
}
