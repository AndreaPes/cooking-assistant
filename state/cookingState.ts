import { create } from "zustand";
import { createTimerSlice, TimerSlice } from "./slices/timerSlice";
import { createRecipeSlice, RecipeSlice } from "@/state/slices/recipeSlice";
import {
  createStepGuideSlice,
  StepGuideSlice,
} from "@/state/slices/stepGuideSlice";

type StoreState = TimerSlice & RecipeSlice & StepGuideSlice;

export const useCookingState = create<StoreState>()((...a) => ({
  ...createTimerSlice(...a),
  ...createRecipeSlice(...a),
  ...createStepGuideSlice(...a),
}));
