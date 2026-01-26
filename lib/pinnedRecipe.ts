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
    details: "Crush 30 g of plain biscuits into fine crumbs.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s2",
    actionVerb: "ADD",
    targetObject: "BISCUITS",
    details: "Put the crumbs in a bowl.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s3",
    actionVerb: "ADD",
    targetObject: "BUTTER",
    details: "Add 25 g of softened butter.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s4",
    actionVerb: "MIX",
    targetObject: "BASE",
    details: "Mix until evenly combined.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s5",
    actionVerb: "CHECK",
    targetObject: "TEXTURE",
    details: "Check texture: crumbs should hold together when pressed.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s6",
    actionVerb: "SPOON",
    targetObject: "BASE",
    details: "Spoon the mixture into the glasses.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s7",
    actionVerb: "PRESS",
    targetObject: "BASE",
    details: "Press gently to form an even base.",
    timerSeconds: 0,
    warning: null,
  },

  // Cream
  {
    id: "s8",
    actionVerb: "ADD",
    targetObject: "CREAM CHEESE",
    details: "Place 120 g of cream cheese in a bowl.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s9",
    actionVerb: "ADD",
    targetObject: "HONEY",
    details: "Add 1½ tablespoons of honey.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s10",
    actionVerb: "MIX",
    targetObject: "CREAM",
    details: "Mix slowly.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s11",
    actionVerb: "SCRAPE",
    targetObject: "BOWL",
    details: "Scrape the sides of the bowl.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s12",
    actionVerb: "MIX",
    targetObject: "CREAM",
    details: "Mix again until smooth.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s13",
    actionVerb: "CHECK",
    targetObject: "TEXTURE",
    details: "Check texture: creamy and lump-free.",
    timerSeconds: 0,
    warning: null,
  },

  // Assembly
  {
    id: "s14",
    actionVerb: "SPOON",
    targetObject: "CREAM",
    details: "Spoon the cream over the biscuit base.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s15",
    actionVerb: "LEVEL",
    targetObject: "SURFACE",
    details: "Level the surface gently.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s16",
    actionVerb: "ADD",
    targetObject: "JAM",
    details: "Add fruit jam, about 1 teaspoons per glass.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s17",
    actionVerb: "SPREAD",
    targetObject: "JAM",
    details: "Spread lightly.",
    timerSeconds: 0,
    warning: null,
  },

  // Finish
  {
    id: "s18",
    actionVerb: "CUT",
    targetObject: "FRUIT",
    details: "Cut fresh fruit into small cubes.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s19",
    actionVerb: "ADD",
    targetObject: "FRUIT",
    details: "Place the fruit on top.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s20",
    actionVerb: "CHECK",
    targetObject: "LAYERS",
    details: "Check final layers.",
    timerSeconds: 0,
    warning: null,
  },
  {
    id: "s21",
    actionVerb: "SERVE",
    targetObject: "DESSERT",
    details: "Serve or chill briefly.",
    timerSeconds: 0,
    warning: null,
  },
] as const;
