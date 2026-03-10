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
    "cream cheese",
    "honey",
    "plain biscuits",
    "butter",
    "fruit jam",
    "fresh fruit",
  ],
  ingredientsMissing: [],

  ingredientsDetailed: [
    { name: "cream cheese", quantity: 120, unit: "g", fromUserIngredients: true },
    { name: "honey", quantity: 1.5, unit: "tbsp", fromUserIngredients: true },
    { name: "plain biscuits", quantity: 30, unit: "g", fromUserIngredients: true },
    { name: "butter", quantity: 25, unit: "g", fromUserIngredients: true },
    { name: "fruit jam", quantity: 2, unit: "tsp", fromUserIngredients: true },
    { name: "fresh fruit", quantity: 1, unit: "portion", fromUserIngredients: true },
  ],
};

export const PINNED_RECIPE_STEPS = [
  {
    id: "s1",
    actionVerb: "CRUSH",
    targetObject: "BISCUITS",
    details: "Crush 20 g of plain biscuits into fine crumbs.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s2",
    actionVerb: "ADD",
    targetObject: "BUTTER",
    details: "Add 25 g of softened butter.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s3",
    actionVerb: "MIX",
    targetObject: "BASE",
    details: "Mix until evenly combined. Crumbs should hold together when pressed.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s4",
    actionVerb: "SPOON",
    targetObject: "BASE",
    details: "Spoon the mixture into the glass and press gently.",
    timerSeconds: 0,
    warning: null,
  },

  // Cream
  {
    id: "s5",
    actionVerb: "ADD",
    targetObject: "CREAM CHEESE",
    details: "Place 120 g of cream cheese in a bowl.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s6",
    actionVerb: "ADD",
    targetObject: "HONEY",
    details: "Add 1½ tablespoons of honey and mix until smooth.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s7",
    actionVerb: "CHECK",
    targetObject: "TEXTURE",
    details: "Check texture: creamy and lump-free.",
    timerSeconds: 0,
    warning: null,
  },

  // Assembly
  {
    id: "s8",
    actionVerb: "SPOON",
    targetObject: "CREAM",
    details: "Spoon the cream over the biscuit base.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s9",
    actionVerb: "ADD",
    targetObject: "JAM",
    details: "Add fruit jam, about 2 teaspoons per glass.",
    timerSeconds: 0,
    warning: null,
  },

  // Finish
  {
    id: "s10",
    actionVerb: "CUT",
    targetObject: "FRUIT",
    details: "Cut fresh fruit into small cubes.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s11",
    actionVerb: "ADD",
    targetObject: "FRUIT",
    details: "Place the fruit on top.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s12",
    actionVerb: "SERVE",
    targetObject: "DESSERT",
    details: "Serve or chill briefly.",
    timerSeconds: 0,
    warning: null,
  },
] as const;
