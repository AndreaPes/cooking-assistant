import { TIMER_TOOLS } from "@/features/cooking/timer/timer.tools";
import { SHOPPING_TOOLS } from "@/features/shopping/shopping.tools";
import { FRIDGE_TOOLS } from "@/features/fridge/fridge.tools";
import { RECIPE_TOOLS } from "@/features/cooking/recipes/recipe.tools";
import { COOKING_TOOLS } from "@/features/cooking/steps/step.tools";

export const ALL_TOOLS = [
  ...TIMER_TOOLS,
  ...SHOPPING_TOOLS,
  ...FRIDGE_TOOLS,
  ...RECIPE_TOOLS,
  ...COOKING_TOOLS,
];
