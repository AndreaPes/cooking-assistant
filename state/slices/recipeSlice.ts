
import { create } from "zustand";
import type { RecipeSuggestionData } from "@/types/interfaces";

type RecipeState = {
  // Full JSON coming from the AI (recipes, selectedRecipeTitle, etc.)
  suggestion: RecipeSuggestionData | null;

  // Index of the currently selected recipe in suggestion.recipes
  selectedIndex: number | null;

  // Set / reset the full suggestion payload
  setSuggestion: (data: RecipeSuggestionData | null) => void;

  // Set / reset the selected recipe index
  setSelectedIndex: (index: number | null) => void;
};

export const useRecipeState = create<RecipeState>((set) => ({
  suggestion: null,
  selectedIndex: null,

  setSuggestion: (data) => set({ suggestion: data }),

  setSelectedIndex: (index) => set({ selectedIndex: index }),
}));
