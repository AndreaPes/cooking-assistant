import { useState, useRef, useEffect, useCallback, RefObject } from "react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useWakeWord } from "@/hooks/useWakeWord";
import { useCookingState } from "@/state/cookingState";
import { AssistantStatus, useAssistantState } from "@/state/assistantState";
import { useFridgeInventoryState } from "@/state/slices/fridgeInventorySlice";
import { useShoppingState } from "@/state/shoppingState";
import { detectIngredientsFromImage } from "@/features/fridge/detectIngredients";
import { AIResponse, AtomicStep } from "@/types/interfaces";

/**
 * Custom Hook: useCookingAssistant
 * --------------------------------
 * This hook encapsulates the entire business logic of the AR Assistant.
 * It acts as the "Brain" connecting the Voice Input, Global State (Zustand),
 * and the AI Backend API.
 *
 * Responsibilities:
 * 1. Manages Voice Input lifecycle (Listening -> Processing -> Idle).
 * 2. Handles "Wake Word" detection.
 * 3. Orchestrates API calls to the AI Brain.
 * 4. Dispatches actions based on AI intent (Timer, Recipes, Inventory, etc.).
 *
 * @param videoRef - Reference to the HTMLVideoElement for Computer Vision tasks.
 * @returns An object containing all necessary state and handlers for the UI.
 */
export function useCookingAssistant(
  videoRef: RefObject<HTMLVideoElement | null>,
) {
  // --- Global State Selectors ---
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
    showAll: showShopList,
    removeItem: removeShopItem,
    clearAll: clearShopList,
  } = useShoppingState();

  // --- Local State ---
  const [aiState, setAiState] = useState<AIResponse | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Voice & Refs ---
  const { isListening, transcript, startListening, stopListening } =
    useVoiceInput();
  const { detected: wakeWordDetected } = useWakeWord();

  const lastProcessedText = useRef("");
  const isProcessingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousInterfaceRef = useRef<AIResponse | null>(null);

  // ===========================================================================
  // HELPER LOGIC
  // ===========================================================================

  /**
   * Automatically spawns a timer if a recipe step requires it.
   * Timers are created in 'idle' mode, waiting for user confirmation.
   *
   * @param step - The current cooking step being displayed.
   */
  const checkAndSpawnTimer = (step: AtomicStep) => {
    if (step && step.timerSeconds && step.timerSeconds > 0) {
      addTimer(step.timerSeconds, step.actionVerb, false, step.id);
    }
  };

  // ===========================================================================
  // INTENT HANDLER (The "Switchboard")
  // ===========================================================================

  /**
   * Routes the structured AI response (Intent) to the specific state actions.
   * Handles UI updates, state mutations, and user feedback (Toasts).
   *
   * @param action - The JSON object returned by the AI API containing intent and parameters.
   */
  const handleAIResponse = async (action: any) => {
    const intentType = action.intent || action.type || action.interface;

    // 1. GENERATE / START COOKING
    if (intentType === "GENERATE_RECIPE") {
      if (action.recipe) {
        loadRecipe(action.recipe);
        setAiState(null); // Clear menu
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
      // Force close any open menus (List/Fridge) to show the Step Guide
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

      // Check for timers in the new step after a brief delay
      setTimeout(() => {
        const updatedState = useCookingState.getState();
        const newIndex = updatedState.currentStepIndex;
        const steps = updatedState.activeRecipe?.steps;

        if (updatedState.activeRecipe && steps && newIndex === steps.length) {
          setToastMessage("Recipe Completed!");
          setTimeout(() => {
            setToastMessage(null);
            stopCooking();
          }, 4000);
        } else if (steps && steps[newIndex]) {
          checkAndSpawnTimer(steps[newIndex]);
        }
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
      if (action.action === "start_existing" && action.id) {
        startTimer(action.id);
        setTimeout(() => setToastMessage(null), 3000);
      } else if (action.action === "start") {
        const label = action.label || "Timer";
        const seconds = action.seconds || 0;
        addTimer(seconds, label, true);
        setTimeout(() => setToastMessage(null), 3000);
      } else if (action.action === "stop") {
        if (action.id) removeTimerById(action.id);
        setTimeout(() => setToastMessage(null), 3000);
      } else if (action.action === "stop_all") {
        clearAllTimers();
      }
      return;
    }

    // 5. SHOPPING LIST
    if (intentType === "SHOPPING_LIST") {
      const label = action.label || action.item || "";

      if (action.action === "add") {
        await addShopItem(label, action.quantity || 1);
        setToastMessage(`Added ${label}`);
      } else if (action.action === "show") {
        await showShopList();
        setAiState({ type: "shopping_list", data: { label: "Shopping List" } });
      } else if (action.action === "remove") {
        await removeShopItem(label);
        setToastMessage(`Removed: ${label}`);
      } else if (action.action === "clear") {
        await clearShopList();
        setToastMessage("Shopping list cleared");
      } else if (action.action === "hide") {
        setAiState(null);
      }

      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    // 6. FRIDGE INVENTORY
    if (intentType === "FRIDGE_INVENTORY") {
      // A. Visual Scan (Analyzes camera feed)
      if (action.action === "scan" && videoRef.current) {
        setToastMessage("📸 Analyzing Fridge...");
        const newScannedItems = await detectIngredientsFromImage(
          videoRef.current,
        );

        if (newScannedItems.length > 0) {
          addFridgeItems(newScannedItems);
          const updatedList = useFridgeInventoryState.getState().fridgeItems;
          // Scan always forces the list to open to show results
          setAiState({
            type: "fridge_inventory",
            data: { fridgeItems: updatedList },
          });
          setToastMessage(`Found ${newScannedItems.length} items.`);
        } else {
          setToastMessage("No food detected 🤷‍♂️");
        }
        setTimeout(() => setToastMessage(null), 3000);
      }

      // B. Manual Add
      else if (action.action === "add_manual" && action.items) {
        addFridgeItems(action.items);
        const names = action.items.map((i: any) => i.name).join(", ");
        setToastMessage(`Added: ${names}`);

        if (aiState?.type === "fridge_inventory") {
          const updatedList = useFridgeInventoryState.getState().fridgeItems;
          setAiState({
            type: "fridge_inventory",
            data: { fridgeItems: updatedList },
          });
        }

        setTimeout(() => setToastMessage(null), 3000);
      }

      // C. Manual Remove
      else if (action.action === "remove_manual" && action.items) {
        removeFridgeItems(action.items);
        const names = action.items.map((i: any) => i.name).join(", ");
        setToastMessage(`Removed: ${names}`);

        if (aiState?.type === "fridge_inventory") {
          const updatedList = useFridgeInventoryState.getState().fridgeItems;
          setAiState({
            type: "fridge_inventory",
            data: { fridgeItems: updatedList },
          });
        }

        setTimeout(() => setToastMessage(null), 3000);
      }

      // D. Show UI
      else if (action.action === "show") {
        const currentList = useFridgeInventoryState.getState().fridgeItems;
        setAiState({
          type: "fridge_inventory",
          data: { fridgeItems: currentList },
        });
        setToastMessage("Opening Fridge Inventory");
        setTimeout(() => setToastMessage(null), 2000);
      }

      // E. Hide UI
      else if (action.action === "hide") {
        setAiState(null);
        setToastMessage("Inventory hidden");
        setTimeout(() => setToastMessage(null), 2000);
      }

      // F. Clear All
      else if (action.action === "clear") {
        clearFridgeInventory();
        setToastMessage("Fridge cleared");
        if (aiState?.type === "fridge_inventory") {
          setAiState({ type: "fridge_inventory", data: { fridgeItems: [] } });
        }
        setTimeout(() => setToastMessage(null), 2000);
      }
      return;
    }

    // 7. GENERIC QUERY (with State Restoration)
    if (intentType === "QUERY") {
      if (action.answer) {
        setAiState((currentState) => {
          // Save current state before overwriting with instruction
          if (currentState?.type !== "instruction") {
            previousInterfaceRef.current = currentState;
          }

          return {
            type: "instruction",
            data: { text: action.answer },
          };
        });

        // Estimate reading time based on word count (min 3s, max 15s)
        const wordCount = action.answer.split(" ").length;
        const readingTime = Math.max(3000, Math.min(15000, wordCount * 350));

        setTimeout(() => {
          setAiState((current) => {
            if (
              current?.type === "instruction" &&
              current.data.text === action.answer
            ) {
              return previousInterfaceRef.current;
            }
            return current;
          });
        }, readingTime);
      }
      return;
    }

    // Fallback for unknown interfaces
    if (action.interface || action.type) {
      setAiState({
        type: (action.type ?? action.interface) as AIResponse["type"],
        data: action.data,
      });
    }
  };

  // ===========================================================================
  // CORE PROCESSOR
  // ===========================================================================

  /**
   * Main Logic: Sends the user speech + current context to the API.
   * Handles loading states and errors.
   *
   * @param textToProcess - The transcribed text from the voice input.
   */
  const processVoice = async (textToProcess: string) => {
    if (!textToProcess) return;

    isProcessingRef.current = true;
    setStatus(AssistantStatus.PROCESSING); // Force Yellow Feedback
    console.log("Processing Request:", textToProcess);

    try {
      // Capture Fresh State Snapshots for the AI Context
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

      // API Call
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
      // Delayed release to prevent "white flash" of the mic icon
      setTimeout(() => {
        setStatus(AssistantStatus.IDLE);
        isProcessingRef.current = false;
        console.log("✅ Processing Complete. Mic unlocked.");
      }, 1000);
    }
  };

  // ===========================================================================
  // EFFECTS
  // ===========================================================================

  // 1. Wake Word Trigger Logic
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
  }, [wakeWordDetected, status, isListening]);

  // 2. Status Sync (Visual Feedback)
  useEffect(() => {
    if (isListening) setStatus(AssistantStatus.LISTENING);
  }, [isListening, setStatus]);

  // 3. Debounced Voice Processing (The "Ear-Brain" Link)
  useEffect(() => {
    if (!isListening && transcript && !isProcessingRef.current) {
      const cleanTranscript = transcript.trim();

      if (cleanTranscript !== lastProcessedText.current) {
        // Immediate Feedback
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

  // ===========================================================================
  // UI HANDLERS
  // ===========================================================================

  /**
   * Manually toggles the microphone.
   * - If IDLE: Starts listening.
   * - If LISTENING: Stops listening immediately.
   * - If PROCESSING: Ignores click (to prevent interrupting API calls).
   */
  const handleMicClick = useCallback(() => {
    if (status === AssistantStatus.PROCESSING) return;

    if (isListening) {
      stopListening();
      setStatus(AssistantStatus.IDLE);
      console.log("🛑 Mic stopped manually");
    } else {
      lastProcessedText.current = "";
      setStatus(AssistantStatus.LISTENING);
      startListening();
      console.log("🎙️ Mic started manually");
    }
  }, [status, isListening, startListening, stopListening, setStatus]);

  // Return everything needed by the Presentation Component
  return {
    status,
    isListening,
    transcript,
    aiState,
    toastMessage,
    handleMicClick,
    processVoice,
  };
}
