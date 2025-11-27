import { FridgeItem } from "@/state/slices/fridgeInventorySlice";

export type InterfaceType =
  | "instruction"
  | "timer"
  | "warning"
  | "success"
  | "idle"
  | "error"
  | "fridge_inventory"
  | "suggest_recipe";

  export interface StepTimer {
    /** 1-based index of the step in the steps[] array */
    stepIndex: number;
    /** Duration in minutes for this step (boiling, baking, resting, etc.) */
    minutes: number;
    /** Human label for the timer, e.g. "Boil pasta" or "Bake cake" */
    label: string;
  }
  
  export interface IngredientDetailed {
    /** Ingredient name, e.g. "spaghetti", "olive oil" */
    name: string;
    /** Numeric quantity, e.g. 200 */
    quantity: number;
    /** Unit, e.g. "g", "ml", "tbsp", "tsp", "piece", "clove" */
    unit: string;
    /** true if the ingredient comes from the user's list, false if it is extra */
    fromUserIngredients: boolean;
  }
  
  export interface RecipeSuggestionData {
    recipeTitle?: string;
    ingredientsYouHave?: string[];
    ingredientsMissing?: string[];
  
    ingredientsDetailed?: IngredientDetailed[];
  
    steps?: string[];
    stepTimers?: StepTimer[];
  
    estimatedTimeMinutes?: number;
    difficulty?: "easy" | "medium" | "hard";
  }
  
  
// This is the shape of the JSON the AI *must* return
export interface AIResponse {
  type: InterfaceType;
  data: {
    text?: string; // For instructions/warnings
    seconds?: number; // For timers
    label?: string; // For timers (e.g. "Pasta")
    items?: FridgeItem[]; // For fridge inventory
  } & RecipeSuggestionData; 
  voiceResponse: string; // What the AI should speak back (optional for now)
}
