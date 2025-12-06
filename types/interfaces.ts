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
  | "suggest_recipe"
  | "step_guide";

export interface StepTimer {
  stepIndex: number;
  minutes: number;
  label: string;
}

export interface IngredientDetailed {
  name: string;
  quantity: number;
  unit: string;
  fromUserIngredients: boolean;
}

/**
 * Definizione di uno Step Atomico (Generato dall'AI)
 */
export interface AtomicStep {
  id: string;
  actionVerb: string;
  targetObject: string;
  details: string;
  icon?: string;
  timerSeconds?: number;
  warning?: string | null;
}

export interface SingleRecipe {
  recipeTitle?: string;
  ingredientsYouHave?: string[];
  ingredientsMissing?: string[];
  ingredientsDetailed?: IngredientDetailed[];

  steps?: AtomicStep[];

  estimatedTimeMinutes?: number;
  difficulty?: "easy" | "medium" | "hard";
}

export interface RecipeSuggestionData {
  recipes?: SingleRecipe[];
  selectedRecipeTitle?: string;
}

export interface AIResponse {
  type: InterfaceType;
  data: {
    text?: string;
    seconds?: number;
    label?: string;
    id?: string;

    // SHOPPING LIST
    quantity?: number;
    shoppingItems?: Array<{ label: string; quantity?: number | null }>;

    // FRIDGE
    fridgeItems?: FridgeItem[];

    recipe?: SingleRecipe;

    direction?: "next" | "prev" | "jump";
    target?: number | "first" | "last";
  } & RecipeSuggestionData;
}
