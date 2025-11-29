import { FridgeItem } from "@/state/slices/fridgeInventorySlice";

export type InterfaceType =
  | "instruction"
  | "timer"
  | "shopping_list"
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

/**
 * A single recipe suggestion returned by the AI.
 */
export interface SingleRecipe {
  recipeTitle?: string;
  ingredientsYouHave?: string[];
  ingredientsMissing?: string[];

  ingredientsDetailed?: IngredientDetailed[];

  steps?: string[];
  stepTimers?: StepTimer[];

  estimatedTimeMinutes?: number;
  difficulty?: "easy" | "medium" | "hard";
}

/**
 * The suggest-recipe payload now contains an ARRAY of recipes.
 */
export interface RecipeSuggestionData {
  recipes?: SingleRecipe[];
  // When the AI wants a specific recipe to open (voice: "Open Aglio e Olio")
  selectedRecipeTitle?: string;
}


// This is the shape of the JSON the AI *must* return
export interface AIResponse {
  type: InterfaceType;
  data: {
    text?: string; // For instructions/warnings
    seconds?: number; // For timers
    label?: string; // For timers (e.g. "Pasta")
    id?: string; // per identificare un timer specifico

    // SHOPPING LIST
    quantity?: number; // quantità singola (es. "add 2 eggs")
    shoppingItems?: Array<{ label: string; quantity?: number | null }>; // lista completa della shopping list

    // FRIDGE INVENTORY
    fridgeItems?: FridgeItem[]; // contenuto del frigo
  } & RecipeSuggestionData;
  voiceResponse: string; // What the AI should speak back (optional for now)
}

/* Usage notes:
 - In code, narrow by `response.type` (switch or if) before accessing type-specific fields.
 - Example:
     if (resp.type === 'shopping_list') {
       // TS knows resp.data may have `items`, `id`, `label` here
     }
 - This avoids optional casts like `data.seconds!` and makes the shapes explicit.
*/
