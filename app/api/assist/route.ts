import { NextResponse } from "next/server";
import OpenAI from "openai";

import { TIMER_RULES, TIMER_JSON_FORMAT } from "@/features/timer/timer.prompt";
import { CORE_JSON_FORMAT } from "@/features/core/core.prompt";
import {
  SHOPPING_LIST_RULES,
  SHOPPING_LIST_JSON_FORMAT,
} from "@/features/shopping_list/shopping_list.prompt";

import {
  FRIDGE_INVENTORY_RULES,
  FRIDGE_INVENTORY_JSON_FORMAT,
} from "@/features/fridge-inventory/FridgeInventory.prompt";

import {
  SUGGEST_RECIPE_RULES,
  SUGGEST_RECIPE_JSON_FORMAT,
} from "@/features/suggest_recipe/suggest_recipe.prompt";

import {
  STEP_GUIDE_RULES,
  STEP_GUIDE_JSON_FORMAT,
} from "@/features/step-guide/stepGuide.prompt";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const {
      userSpeech,
      activeTimers,
      fridgeItems = [],
      currentRecipes = [],
      activeRecipe = null,
      selectedRecipe = null,
    } = await req.json();

    // Helper to format list for AI (Timers)
    const timerContextString =
      activeTimers && activeTimers.length > 0
        ? activeTimers
            .map(
              (t: any) =>
                `- ID: "${t.id}", Label: "${t.label}", Status: "${t.status}"`,
            )
            .join("\n")
        : "NONE";

    // Helper to format list for AI (Fridge)
    const fridgeListString =
      fridgeItems && fridgeItems.length > 0
        ? fridgeItems
            .map((i: any) => {
              const qty = i.quantity ?? 1;
              const name = i.name ?? "unknown";
              return `${qty}x ${name}`;
            })
            .join(", ")
        : "NONE";

    // Helper to format list for AI (Recipes)
    const recipesListString =
      currentRecipes && currentRecipes.length > 0
        ? currentRecipes
            .map((r: any, idx: number) => `#${idx + 1}: "${r.recipeTitle}"`)
            .join(", ")
        : "NONE";

    const previewContext = selectedRecipe
      ? `CURRENTLY PREVIEWING (NOT COOKING YET): "${selectedRecipe.recipeTitle}" (Ingredients: ${selectedRecipe.ingredientsDetailed?.map((i: any) => i.name).join(", ")})`
      : "NO RECIPE SELECTED (User is looking at the list)";

    // Helper for Active Recipe and Cooking Phase
    const activeRecipeContext = activeRecipe
      ? `CURRENTLY COOKING: "${activeRecipe.title}" (Step ${activeRecipe.currentStepIndex + 1} of ${activeRecipe.steps?.length || "?"})`
      : "CURRENTLY COOKING: NONE";

    console.log(
      `🎤 User: "${userSpeech}" | Timers: [${timerContextString}] | Recipes: [${recipesListString}]`,
    );

    // Build the prompt dynamically
    const systemPrompt = `
      You are a Logic Controller for an AR Cooking App.
      Your goal is to ACT, not just answer. 
      If the user's request matches a Feature Rule, trigger that feature IMMEDIATELY.
      Do NOT return "QUERY" or explain what you can't do if a valid Action is available.
      
      CURRENT APP STATE:
      - ACTIVE TIMERS: [${timerContextString}]
      - FRIDGE ITEMS: [${fridgeListString}]
      - VISIBLE RECIPES (SUGGESTIONS): [${recipesListString}]
      - ${previewContext}
      - ${activeRecipeContext}
      
      === FEATURE RULES (Highest Priority first) ===
      
      ${TIMER_RULES}
      ${STEP_GUIDE_RULES}
      ${SUGGEST_RECIPE_RULES}      
      ${SHOPPING_LIST_RULES}
      ${FRIDGE_INVENTORY_RULES}

      Additional connection rule:
      - **STRICT INVENTORY MODE:**
        - The list "FRIDGE ITEMS" contains EVERYTHING the user has.
        - If the user asks for recipes, do NOT assume they have ingredients not listed there (even basics like bread, oil, pasta).
        - If a recipe needs an item not in "FRIDGE ITEMS", mark it as missing.
        - Treat "sliced ham", "ham", "prosciutto" as synonyms when matching.
      
      =====================
      
      VALID INTENTS (JSON Only):
      ${TIMER_JSON_FORMAT}
      ${STEP_GUIDE_JSON_FORMAT}
      ${SUGGEST_RECIPE_JSON_FORMAT}
      ${SHOPPING_LIST_JSON_FORMAT}
      ${FRIDGE_INVENTORY_JSON_FORMAT}
      ${CORE_JSON_FORMAT} 
      
      Return ONLY JSON.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userSpeech },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const content = JSON.parse(response.choices[0].message.content || "{}");
    console.log("AI Output:", content);

    return NextResponse.json(content);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Brain freeze" }, { status: 500 });
  }
}
