import { StateCreator } from "zustand";
import { SingleRecipe, AtomicStep } from "@/types/interfaces";

export interface StepGuideSlice {
  activeRecipe: SingleRecipe | null;
  currentStepIndex: number; // -1: Overview, 0..N: Steps, N+1: Finished

  loadRecipe: (recipe: SingleRecipe) => void;
  nextStep: () => void;
  prevStep: () => void;
  jumpToStep: (stepNumber: number) => void;
  stopCooking: () => void;

  getCurrentStep: () => AtomicStep | null;
}

export const createStepGuideSlice: StateCreator<StepGuideSlice> = (
  set,
  get,
) => ({
  activeRecipe: null,
  currentStepIndex: -1,

  loadRecipe: (recipe) => {
    console.log(
      "👨‍🍳 Loading Recipe:",
      recipe.recipeTitle,
      "Steps:",
      recipe.steps?.length,
    );
    set({ activeRecipe: recipe, currentStepIndex: -1 });
  },

  stopCooking: () => {
    console.log("🛑 Stop Cooking");
    set({ activeRecipe: null, currentStepIndex: -1 });
  },

  nextStep: () =>
    set((state) => {
      // 1. DEBUG: Controlliamo se la ricetta esiste
      if (!state.activeRecipe || !state.activeRecipe.steps) {
        console.warn("⚠️ nextStep failed: No active recipe found in state");
        return {};
      }

      const totalSteps = state.activeRecipe.steps.length;

      // 2. DEBUG: Stampiamo dove siamo e dove vogliamo andare
      console.log(
        `🦶 Request Next: Current=${state.currentStepIndex} / Total=${totalSteps}`,
      );

      // Calcoliamo il prossimo indice
      // Se current è (Length - 1), il prossimo è Length (che significa "Schermata Finale")
      // Se current è Length, restiamo lì.
      const nextIndex = Math.min(state.currentStepIndex + 1, totalSteps);

      if (nextIndex === state.currentStepIndex) {
        console.log("🚫 Already at the end/limit.");
        return {}; // Nessun cambiamento
      }

      console.log(`✅ Advancing to index: ${nextIndex}`);
      return { currentStepIndex: nextIndex };
    }),

  prevStep: () =>
    set((state) => {
      if (!state.activeRecipe) return {};

      // Non permettiamo di tornare a -1 (Overview) se stiamo cucinando, fermiamoci a 0
      const prevIndex = Math.max(state.currentStepIndex - 1, 0);

      console.log(`⬅️ Prev Step: ${prevIndex}`);
      return { currentStepIndex: prevIndex };
    }),

  jumpToStep: (target) =>
    set((state) => {
      if (!state.activeRecipe || !state.activeRecipe.steps) return {};

      const maxIndex = state.activeRecipe.steps.length; // Include "Finished" state
      const safeIndex = Math.max(0, Math.min(target, maxIndex));

      console.log(`🦘 Jumping to step: ${safeIndex}`);
      return { currentStepIndex: safeIndex };
    }),

  getCurrentStep: () => {
    const { activeRecipe, currentStepIndex } = get();
    if (
      !activeRecipe ||
      !activeRecipe.steps ||
      currentStepIndex < 0 ||
      currentStepIndex >= activeRecipe.steps.length
    ) {
      return null;
    }
    return activeRecipe.steps[currentStepIndex];
  },
});
