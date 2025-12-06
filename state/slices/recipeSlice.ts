import { StateCreator } from "zustand";
import type { RecipeSuggestionData } from "@/types/interfaces";

export interface RecipeSlice {
  suggestion: RecipeSuggestionData | null;
  selectedSuggestionIndex: number | null;

  setSuggestion: (data: RecipeSuggestionData | null) => void;
  setSelectedSuggestionIndex: (index: number | null) => void;
}

export const createRecipeSlice: StateCreator<RecipeSlice> = (set) => ({
  suggestion: null,
  selectedSuggestionIndex: null,

  setSuggestion: (data) => set({ suggestion: data }),
  setSelectedSuggestionIndex: (index) =>
    set({ selectedSuggestionIndex: index }),
});
