import type { RecipeSuggestionData } from "@/types/interfaces";

// Fix optional recipes type
type SingleRecipe = NonNullable<RecipeSuggestionData["recipes"]>[number];

export const PINNED_RECIPE_TITLE = "No-Bake Cheesecake in a Glass";

/**
 * 1) The pinned suggestion card (always no missing ingredients)
 */
export const PINNED_RECIPE: SingleRecipe = {
  title: PINNED_RECIPE_TITLE,
  estimatedTimeMinutes: 10,
  difficulty: "easy",

  ingredientsYouHave: [
    "cream cheese (Philadelphia)",
    "honey",
    "plain biscuits",
    "butter",
    "fruit jam",
    "fresh fruit",
  ],
  ingredientsMissing: [],

  ingredientsDetailed: [
    { name: "cream cheese (Philadelphia)", quantity: 120, unit: "g", fromUserIngredients: true },
    { name: "honey", quantity: 1.5, unit: "tbsp", fromUserIngredients: true },
    { name: "plain biscuits", quantity: 30, unit: "g", fromUserIngredients: true },
    { name: "butter", quantity: 25, unit: "g", fromUserIngredients: true },
    { name: "fruit jam", quantity: 2, unit: "tsp", fromUserIngredients: true },
    { name: "fresh fruit", quantity: 1, unit: "portion", fromUserIngredients: true },
  ],
};

/**
 * 2) The pinned cooking steps (exactly as you wrote them)
 *
 * NOTE:
 * If your cooking steps tool expects more fields (warning/timerSeconds/etc)
 * we can add them later, but "instruction" is the important one.
 */
export const PINNED_RECIPE_STEPS = [
  // Base
  { instruction: "Crush 30 g plain biscuits into fine crumbs." },
  { instruction: "Put the crumbs in a bowl." },
  { instruction: "Add 25 g softened butter." },
  { instruction: "Mix until evenly combined." },
  { instruction: "Check texture: crumbs hold together when pressed." },
  { instruction: "Spoon the mixture into the glasses." },
  { instruction: "Press gently to form an even base." },

  // Cream
  { instruction: "Place 120 g cream cheese (Philadelphia) in a bowl." },
  { instruction: "Add 1½ tablespoons honey." },
  { instruction: "Mix slowly." },
  { instruction: "Scrape the sides of the bowl." },
  { instruction: "Mix again until smooth." },
  { instruction: "Check texture: creamy and lump-free." },

  // Assembly
  { instruction: "Spoon the cream over the biscuit base." },
  { instruction: "Level the surface gently." },
  { instruction: "Add fruit jam (about 1–1½ teaspoons per glass)." },
  { instruction: "Spread lightly." },

  // Finish
  { instruction: "Cut fresh fruit (to taste) into small cubes." },
  { instruction: "Place the fruit on top." },
  { instruction: "Check final layers." },
  { instruction: "Serve or chill briefly." },
] as const;
