export type InterfaceType =
  | "instruction"
  | "timer"
  | "warning"
  | "success"
  | "idle"
  | "error"
  | "suggest_recipe";

export type RecipeSuggestionData = {
  recipeTitle: string;
  ingredientsYouHave: string[];
  ingredientsMissing: string[];
  steps: string[];
  estimatedTimeMinutes?: number;
  difficulty?: "easy" | "medium" | "hard";
};
  
// This is the shape of the JSON the AI *must* return
export interface AIResponse {
  type: InterfaceType;
  data: {
    text?: string; // For instructions/warnings
    seconds?: number; // For timers
    label?: string; // For timers (e.g. "Pasta")
  } & RecipeSuggestionData; 
  voiceResponse: string; // What the AI should speak back (optional for now)
}
