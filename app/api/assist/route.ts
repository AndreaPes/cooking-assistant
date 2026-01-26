import { NextResponse } from "next/server";
import OpenAI from "openai";

import { ALL_TOOLS } from "@/lib/tools/registry";
import {
  PINNED_RECIPE,
  PINNED_RECIPE_STEPS,
  PINNED_RECIPE_TITLE,
} from "@/lib/pinnedRecipe";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ helper: force pinned recipe as option #1 and keep exactly 4
function injectPinnedRecipe(recipes: any[]) {
  const list = Array.isArray(recipes) ? recipes : [];

  const withoutPinned = list.filter(
    (r) =>
      (r?.title ?? "").toLowerCase().trim() !==
      PINNED_RECIPE_TITLE.toLowerCase().trim(),
  );

  return [PINNED_RECIPE, ...withoutPinned].slice(0, 4);
}

/**
 * Main API Route for the AR Cooking Assistant.
 */
export async function POST(req: Request) {
  try {
    // -------------------------------------------------------------------------
    // 1. PAYLOAD EXTRACTION
    // -------------------------------------------------------------------------
    const {
      userSpeech,
      activeTimers,
      fridgeItems = [],
      shoppingList = [],
      currentRecipes = [],
      activeRecipe = null,
      selectedRecipe = null,
    } = await req.json();

    // -------------------------------------------------------------------------
    // 2. CONTEXT BUILDING
    // -------------------------------------------------------------------------
    const timerContextString =
      activeTimers && activeTimers.length > 0
        ? activeTimers
            .map(
              (t: any) =>
                `- ID: "${t.id}", Label: "${t.label}", Status: "${t.status}"`,
            )
            .join("\n")
        : "NONE";

    const fridgeContextString =
      fridgeItems && fridgeItems.length > 0
        ? fridgeItems.map((i: any) => `${i.quantity ?? 1}x ${i.name}`).join("\n")
        : "NONE";

    const shoppingContextString =
      shoppingList && shoppingList.length > 0
        ? shoppingList.map((i: any) => `${i.quantity ?? 1}x ${i.label}`).join(", ")
        : "EMPTY";

    const recipesContextString =
      currentRecipes && currentRecipes.length > 0
        ? currentRecipes.map((r: any) => `"${r.title}"`).join(", ")
        : "NONE";

    const activeRecipeContext = activeRecipe
      ? `COOKING NOW: "${activeRecipe.title}" (Step ${activeRecipe.currentStepIndex + 1})`
      : "NOT COOKING";

    const previewContext = selectedRecipe
      ? `PREVIEWING RECIPE: "${selectedRecipe.title}"`
      : "NO RECIPE SELECTED";

    console.log(`🎤 User: "${userSpeech}"`);

    // -------------------------------------------------------------------------
    // 3. SYSTEM PROMPT
    // -------------------------------------------------------------------------
    const systemPrompt = `
      You are an expert AR Cooking Assistant.
      
      CURRENT CONTEXT:
      - Active Timers: ${timerContextString}
      - Fridge Inventory: ${fridgeContextString}
      - Shopping List: ${shoppingContextString}
      - Visible Recipe Suggestions: ${recipesContextString}
      - ${activeRecipeContext}
      - ${previewContext}
      
      CORE INSTRUCTIONS:
      1. Analyze the user's voice command and the Current App State.
      2. Call the appropriate TOOL to perform the action.
      3. DO NOT hallucinate functionality not provided by tools.

      BEHAVIORAL RULES:
      - TIMERS: If a matching timer is IDLE, start it. BUT if the user says "another", "new", or if the existing timer is already RUNNING, you MUST create a NEW timer (action='start'). Allow multiple concurrent timers.
      - RECIPES: When the user asks for food ideas, NEVER output a bulleted text list. ALWAYS call 'generate_recipe_ideas' to display the visual cards.
      - INGREDIENTS MATCHING: When generating recipes, strictly compare ingredients with the "Fridge Inventory" context to populate 'ingredientsYouHave' and 'ingredientsMissing' accurately.
      - COOKING MODE: If the user says "Start cooking", call 'generate_cooking_steps'.
      - NAVIGATION: If a recipe is ACTIVE, interpret "Next", "Back", "Repeat" as 'navigate_steps'.
      - SAFETY: Flag hot items or raw meat in 'warning'.
      - SHOPPING ACTIONS: "Add [item]" -> action='add'. Use 'remove' ONLY if user explicitly says remove/delete/bought.
      - SHOPPING vs FRIDGE: Distinguish "I have" (Fridge) vs "I need" (Shopping).
      - DATA EXTRACTION: If user says multiple items, include ALL in tool call array.
      - LISTS: Never read lists aloud. Use tools.
      - VISION: "Scan/Look/See what I have" -> use 'manage_fridge_inventory' action='scan'.
      - GENERAL: Only use text replies for general knowledge. Max 1-2 sentences, English.
      - UNIT CONVERSION: Do the math accurately, concise reply.
    `;

    // -------------------------------------------------------------------------
    // 4. OPENAI COMPLETION
    // -------------------------------------------------------------------------
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userSpeech },
      ],
      tools: ALL_TOOLS,
      tool_choice: "auto",
      temperature: 0,
    });

    const message = response.choices[0].message;

    // -------------------------------------------------------------------------
    // 5. INTENT MAPPING
    // -------------------------------------------------------------------------
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];

      if (toolCall.type !== "function") {
        console.warn("Unknown tool type received:", toolCall.type);
        return NextResponse.json({
          intent: "QUERY",
          answer: "Error: Unknown tool type.",
        });
      }

      const fnName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      console.log(`🔧 Tool Called: ${fnName}`, args);

      // --- TIMER MANAGEMENT ---
      if (fnName === "manage_timer") {
        return NextResponse.json({
          intent: "TIMER",
          ...args,
        });
      }

      // --- SHOPPING LIST MANAGEMENT ---
      if (fnName === "manage_shopping_list") {
        return NextResponse.json({
          intent: "SHOPPING_LIST",
          ...args,
        });
      }

      // --- FRIDGE INVENTORY MANAGEMENT ---
      if (fnName === "manage_fridge_inventory") {
        return NextResponse.json({
          intent: "FRIDGE_INVENTORY",
          ...args,
        });
      }

      // --- RECIPE SUGGESTIONS (GENERATION) ---
      if (fnName === "generate_recipe_ideas") {
  const recipes = injectPinnedRecipe(args.recipes);

  return NextResponse.json({
    intent: "SUGGEST_RECIPE",
    data: {
      recipes,
      selectedTitle: null,
    },
  });
}


      // --- RECIPE PREVIEW (SELECTION) ---
      if (fnName === "select_recipe") {
        // ✅ keep the existing list (IMPORTANT for UI)
        return NextResponse.json({
          intent: "SUGGEST_RECIPE",
          data: {
            recipes: currentRecipes, // ✅ keep what was already visible
            selectedTitle: args.title,
          },
        });
      }

      // --- RECIPE EXIT (DESELECTION) ---
      if (fnName === "deselect_recipe") {
        return NextResponse.json({
          intent: "SUGGEST_RECIPE",
          data: {
            recipes: currentRecipes, // ✅ return to list
            selectedTitle: null,
          },
        });
      }

      // --- COOKING SESSION (START) ---
      if (fnName === "generate_cooking_steps") {
  const title = (args.title ?? "").toLowerCase();

  const isPinned =
    title.includes(PINNED_RECIPE_TITLE.toLowerCase()) ||
    PINNED_RECIPE_TITLE.toLowerCase().includes(title);

  return NextResponse.json({
    intent: "GENERATE_RECIPE",
    recipe: {
      title: isPinned ? PINNED_RECIPE_TITLE : args.title,
      steps: isPinned ? PINNED_RECIPE_STEPS : args.steps,
      ingredients: [],
    },
  });
}



      // --- COOKING NAVIGATION (STEPS) ---
      if (fnName === "navigate_steps") {
        return NextResponse.json({
          intent: "NAVIGATE",
          ...args,
        });
      }
    }

    // -------------------------------------------------------------------------
    // 6. FALLBACK (QUERY)
    // -------------------------------------------------------------------------
    return NextResponse.json({
      intent: "QUERY",
      answer: message.content || "I didn't understand that command.",
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Brain freeze" }, { status: 500 });
  }
}
