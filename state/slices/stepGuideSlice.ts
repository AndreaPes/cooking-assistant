import { StateCreator } from "zustand";
import { SingleRecipe, AtomicStep } from "@/types/interfaces";

export interface StepGuideSlice {
  // State
  activeRecipe: SingleRecipe | null;
  currentStepIndex: number;

  // Actions
  loadRecipe: (recipe: SingleRecipe) => void;
  nextStep: () => void;
  prevStep: () => void;
  jumpToStep: (stepNumber: number) => void;
  stopCooking: () => void;

  // Helper
  getCurrentStep: () => AtomicStep | null;
}

export const createStepGuideSlice: StateCreator<StepGuideSlice> = (
  set,
  get,
) => ({
  activeRecipe: null,
  currentStepIndex: -1,

  // Start the session (Starts at -1: Overview)
  loadRecipe: (recipe) => set({ activeRecipe: recipe, currentStepIndex: -1 }),

  stopCooking: () => set({ activeRecipe: null, currentStepIndex: -1 }),

  nextStep: () =>
    set((state) => {
      if (!state.activeRecipe || !state.activeRecipe.steps) {
        console.warn("nextStep called but no active recipe found!");
        return {};
      }
      const maxIndex = state.activeRecipe.steps.length - 1;
      const next = Math.min(state.currentStepIndex + 1, maxIndex);

      console.log(
        `Next Step: ${state.currentStepIndex} -> ${next} (Max: ${maxIndex})`,
      );

      if (next === state.currentStepIndex) {
        console.log("Already at last step");
        return {};
      }
      return { currentStepIndex: next };
    }),

  prevStep: () =>
    set((state) => {
      const prev = Math.max(state.currentStepIndex - 1, 0);
      console.log(`⬅️ Prev Step: ${state.currentStepIndex} -> ${prev}`);
      return { currentStepIndex: prev };
    }),

  jumpToStep: (target) =>
    set((state) => {
      if (!state.activeRecipe || !state.activeRecipe.steps) return {};
      const maxIndex = state.activeRecipe.steps.length - 1;
      const safeIndex = Math.max(0, Math.min(target, maxIndex));

      console.log(`Jump to: ${safeIndex}`);
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
