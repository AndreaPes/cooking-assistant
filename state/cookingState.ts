import { create } from "zustand";
import { createTimerSlice, TimerSlice } from "./slices/timerSlice";
import { createRecipeSlice, RecipeSlice } from "@/state/slices/recipeSlice";
import {
  createStepGuideSlice,
  StepGuideSlice,
} from "@/state/slices/stepGuideSlice";

/**
 * Combined state interface for the entire Cooking Domain.
 * Aggregates Timers, Recipes, and Step Guidance into a single store.
 */
type StoreState = TimerSlice & RecipeSlice & StepGuideSlice;

/**
 * Main Global Store for Cooking Logic.
 * Uses the "Slice Pattern" to combine multiple feature stores into one hook.
 *
 * Usage:
 * const { activeRecipe, addTimer } = useCookingState();
 */
export const useCookingState = create<StoreState>()((...a) => ({
  ...createTimerSlice(...a),
  ...createRecipeSlice(...a),
  ...createStepGuideSlice(...a),
}));
