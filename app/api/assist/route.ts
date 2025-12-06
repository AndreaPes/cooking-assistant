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
  apiKey: process.env.GOOGLE_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
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
    const timerListString =
      activeTimers && activeTimers.length > 0
        ? activeTimers.map((t: any) => `"${t.label}"`).join(", ")
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
      `🎤 User: "${userSpeech}" | Timers: [${timerListString}] | Recipes: [${recipesListString}]`,
    );

    // Build the prompt dynamically
    const systemPrompt = `
      You are a Logic Controller for an AR Cooking App.
      
      CURRENT APP STATE:
      - ACTIVE TIMERS: [${timerListString}]
      - FRIDGE ITEMS: [${fridgeListString}]
      - VISIBLE RECIPES (SUGGESTIONS): [${recipesListString}]
      - ${previewContext}
      - ${activeRecipeContext}
      
      Classify user intent into JSON.
      
      === FEATURE RULES ===
      
      ${TIMER_RULES}
      ${SHOPPING_LIST_RULES}
      ${FRIDGE_INVENTORY_RULES}
      ${SUGGEST_RECIPE_RULES}      
      ${STEP_GUIDE_RULES}

      Additional connection rule:
      - When the user asks what they can cook "with what I have in the fridge"
        or similar expressions (e.g. "using my fridge items", "with these ingredients"),
        you MUST treat CURRENT FRIDGE ITEMS as the list of ingredients they currently have.
      - In that case, respond using the "suggest_recipe" JSON format, where:
        - ingredientsYouHave and ingredientsDetailed.fromUserIngredients = true
          are derived from CURRENT FRIDGE ITEMS.
        - Any extra ingredients not in CURRENT FRIDGE ITEMS must be marked as
          ingredientsMissing and have fromUserIngredients = false.
      
      =====================
      
      JSON STRUCTURE:
      {
        "intent": "string",
        ...fields based on intent
      }
      
      VALID INTENTS:
      ${TIMER_JSON_FORMAT}
      ${SHOPPING_LIST_JSON_FORMAT}
      ${CORE_JSON_FORMAT}
      ${FRIDGE_INVENTORY_JSON_FORMAT}
      ${SUGGEST_RECIPE_JSON_FORMAT}
      ${STEP_GUIDE_JSON_FORMAT}
      
      Return ONLY JSON.
    `;

    const response = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
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
