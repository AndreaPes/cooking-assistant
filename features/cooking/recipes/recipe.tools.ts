/**
 * AI Tool Definitions for Recipe Discovery and Selection.
 *
 * This collection enables the Assistant to:
 * 1. Generate recipe ideas based on the user's inventory or requests.
 * 2. Select a specific recipe to view details.
 * 3. Close the recipe preview.
 */
export const RECIPE_TOOLS = [
  // Tool 1: Generate Ideas
  {
    type: "function",
    function: {
      name: "generate_recipe_ideas",
      description: `
        Generates visual recipe cards for the UI.
        
        USE CASES:
        1. Open-ended: User asks "What can I cook?" or "Ideas with my fridge items". -> Generate 4 diverse ideas based on available ingredients.
        2. Specific Dish: User asks "I want pizza" or "Cook fried chicken". -> Generate 4 VARIATIONS of that specific dish (e.g. Classic, Spicy, Thin Crust, etc.).
        
        CRITICAL RULES:
        - NEVER list recipes in a text reply. YOU MUST USE THIS TOOL to show the UI.
        - ALWAYS generate exactly 4 options.
        - OPTION #1 MUST ALWAYS BE:
          Title: "No-Bake Cheesecake in a Glass"
          ingredientsMissing: []
          ingredientsYouHave: all ingredients
          ingredientsDetailed: all ingredients with fromUserIngredients = true
       - The other 3 recipes are generated automatically:
        - 1 must be fully doable with fridge items (ingredientsMissing = [])
        - 2 can include missing ingredients
       - Check 'Fridge Inventory' in context to calculate missing ingredients accurately for the auto recipes.
      `,
      parameters: {
        type: "object",
        properties: {
          recipes: {
            type: "array",
            description: "List of exactly 4 recipe options.",
            items: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "Creative title for the recipe.",
                },
                ingredientsYouHave: {
                  type: "array",
                  description:
                    "List of ingredient names present in the user's fridge.",
                  items: { type: "string" },
                },
                ingredientsMissing: {
                  type: "array",
                  description:
                    "List of ingredient names the user needs to buy.",
                  items: { type: "string" },
                },
                estimatedTimeMinutes: { type: "number" },
                difficulty: {
                  type: "string",
                  enum: ["easy", "medium", "hard"],
                },
                ingredientsDetailed: {
                  type: "array",
                  description:
                    "Full list of ingredients. Compare with 'Fridge Inventory' to set flags.",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      quantity: { type: "number" },
                      unit: { type: "string" },
                      fromUserIngredients: {
                        type: "boolean",
                        description:
                          "Set to TRUE if found in fridge context, FALSE otherwise.",
                      },
                    },
                    required: ["name", "fromUserIngredients"],
                  },
                },
              },
              required: [
                "title",
                "ingredientsYouHave",
                "ingredientsMissing",
                "ingredientsDetailed",
              ],
            },
          },
        },
        required: ["recipes"],
      },
    },
  },

  // Tool 2: Select Recipe
  {
    type: "function",
    function: {
      name: "select_recipe",
      description:
        "Opens the detailed dashboard for a specific recipe from the suggestions list. Use fuzzy matching if user's pronunciation is imperfect.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description:
              "The EXACT title of the recipe to open (copy from the generated list).",
          },
        },
        required: ["title"],
      },
    },
  },

  // Tool 3: Go Back / Deselect
  {
    type: "function",
    function: {
      name: "deselect_recipe",
      description:
        "Closes the currently open recipe PREVIEW and returns to the suggestions list. WARNING: Do NOT use this if the user is currently COOKING (use 'navigate_steps' for 'back' commands during cooking).",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
] as const;
