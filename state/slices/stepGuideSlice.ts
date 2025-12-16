import { StateCreator } from "zustand";
import { SingleRecipe, AtomicStep } from "@/types/interfaces";

/**
 * Interface definition for the Step Guide Slice.
 * Manages the navigation through the steps of the currently active recipe.
 */
export interface StepGuideSlice {
  /** The recipe currently being cooked. Null if no recipe is active. */
  activeRecipe: SingleRecipe | null;
  /** The index of the current step in the recipe's step array. -1 indicates overview mode. */
  currentStepIndex: number;

  /**
   * Loads a recipe into the guide and resets the step index.
   * @param recipe - The recipe object to load.
   */
  loadRecipe: (recipe: SingleRecipe) => void;

  /**
   * Advances to the next step in the recipe.
   * Checks bounds to prevent overflowing the step array.
   */
  nextStep: () => void;

  /**
   * Goes back to the previous step in the recipe.
   * Checks bounds to prevent negative indices.
   */
  prevStep: () => void;

  /**
   * Jumps directly to a specific step index.
   * Clamps the target index between 0 and the maximum step count.
   *
   * @param stepNumber - The target step index.
   */
  jumpToStep: (stepNumber: number) => void;

  /**
   * Stops the current cooking session and clears the active recipe.
   */
  stopCooking: () => void;

  /**
   * Retrieves the current step object based on the current index.
   * @returns The current AtomicStep or null if invalid.
   */
  getCurrentStep: () => AtomicStep | null;
}

/**
 * Slice creator for the Step Guide state.
 * Implements logic for recipe navigation and step tracking.
 *
 * @param set - The Zustand set function.
 * @param get - The Zustand get function.
 */
export const createStepGuideSlice: StateCreator<StepGuideSlice> = (
  set,
  get,
) => ({
  activeRecipe: null,
  currentStepIndex: -1,

  loadRecipe: (recipe) => {
    set({ activeRecipe: recipe, currentStepIndex: -1 });
  },

  stopCooking: () => {
    set({ activeRecipe: null, currentStepIndex: -1 });
  },

  nextStep: () =>
    set((state) => {
      if (!state.activeRecipe || !state.activeRecipe.steps) {
        return {};
      }

      const totalSteps = state.activeRecipe.steps.length;
      const nextIndex = Math.min(state.currentStepIndex + 1, totalSteps);

      if (nextIndex === state.currentStepIndex) {
        return {};
      }

      return { currentStepIndex: nextIndex };
    }),

  prevStep: () =>
    set((state) => {
      if (!state.activeRecipe) return {};
      const prevIndex = Math.max(state.currentStepIndex - 1, 0);
      return { currentStepIndex: prevIndex };
    }),

  jumpToStep: (target) =>
    set((state) => {
      if (!state.activeRecipe || !state.activeRecipe.steps) return {};

      const maxIndex = state.activeRecipe.steps.length;
      const safeIndex = Math.max(0, Math.min(target, maxIndex));

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
