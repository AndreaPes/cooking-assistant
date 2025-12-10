import { TIMER_TOOLS } from "@/features/timer/timer.tools";
import { SHOPPING_TOOLS } from "@/features/shopping_list/shopping.tools";
import { FRIDGE_TOOLS } from "@/features/fridge-inventory/fridge.tools";
import { RECIPE_TOOLS } from "@/features/suggest_recipe/recipe.tools";
import { COOKING_TOOLS } from "@/features/step-guide/step.tools";

export const ALL_TOOLS = [
  ...TIMER_TOOLS,
  ...SHOPPING_TOOLS,
  ...FRIDGE_TOOLS,
  ...RECIPE_TOOLS,
  ...COOKING_TOOLS,
];
