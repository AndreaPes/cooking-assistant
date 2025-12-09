import { NextResponse } from "next/server";
import OpenAI from "openai";

import { ALL_TOOLS } from "@/lib/tools/registry";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const {
      userSpeech,
      activeTimers,
      fridgeItems = [],
      shoppingList = [],
      currentRecipes = [],
      activeRecipe = null,
      selectedRecipe = null,
    } = await req.json();

    // --- CONTEXT BUILDING ---

    const timerContextString =
      activeTimers && activeTimers.length > 0
        ? activeTimers
            .map(
              (t: any) =>
                `- ID: "${t.id}", Label: "${t.label}", Status: "${t.status}"`,
            )
            .join("\n")
        : "NONE";

    const fridgeListString =
      fridgeItems && fridgeItems.length > 0
        ? fridgeItems
            .map((i: any) => `${i.quantity ?? 1}x ${i.name}`)
            .join("\n")
        : "NONE";

    const shoppingContextString =
      shoppingList && shoppingList.length > 0
        ? shoppingList
            .map((i: any) => `${i.quantity ?? 1}x ${i.label}`)
            .join(", ")
        : "EMPTY";

    const recipesListString =
      currentRecipes && currentRecipes.length > 0
        ? currentRecipes.map((r: any) => `"${r.title}"`).join(", ")
        : "NONE";

    const activeRecipeContext = activeRecipe
      ? `COOKING NOW: "${activeRecipe.title}" (Step ${activeRecipe.currentStepIndex + 1})`
      : "NOT COOKING";

    console.log("CONTEXT CHECK:", activeRecipeContext);

    const previewContext = selectedRecipe
      ? `PREVIEWING RECIPE: "${selectedRecipe.title}"`
      : "NO RECIPE SELECTED";

    console.log(`🎤 User: "${userSpeech}"`);

    // --- SYSTEM PROMPT ---
    const systemPrompt = `
      You are an expert AR Cooking Assistant.
      
      CURRENT CONTEXT:
      - Active Timers: ${timerContextString}
      - Fridge Inventory: ${fridgeListString}
        - Shopping List: ${shoppingContextString}
      - Visible Recipe Suggestions: ${recipesListString}
      - ${activeRecipeContext}
      - ${previewContext}
      
      CORE INSTRUCTIONS:
      1. Analyze the user's voice command and the Current App State.
      2. Call the appropriate TOOL to perform the action.
      3. DO NOT hallucinate functionality not provided by tools.

      BEHAVIORAL RULES:
      - TIMERS: Check 'Active Timers' before creating new ones. If a timer is IDLE and matches the request, start THAT one.
      - RECIPES: When the user asks for food ideas, NEVER output a bulleted text list. You are an AR interface, not a chatbot. ALWAYS call 'generate_recipe_ideas' to display the visual cards.
      - INGREDIENTS MATCHING: When generating recipes, strictly compare the required ingredients with the "Fridge Inventory" context to populate 'ingredientsYouHave' and 'ingredientsMissing' accurately.
      - COOKING MODE: If the user says "Start cooking", call 'generate_cooking_steps'.
      - NAVIGATION: If the context shows a recipe is ACTIVE (Cooking Now), interpret "Next", "Back", or "Repeat" as 'navigate_steps', NOT as generic chat.
      - SAFETY: When generating steps, be paranoid about safety. Always flag hot items or raw meat in the 'warning' field.
      - SHOPPING vs FRIDGE: Distinguish carefully between "I have" (Fridge Inventory) and "I need/buy" (Shopping List).
      - LISTS: Never read the Shopping List or Recipe List aloud. Always use the corresponding TOOL ('manage_shopping_list' with action='show', or 'generate_recipe_ideas') to display the UI.
      - VISION: If the user says "Scan", "Look", or "See what I have", ALWAYS use 'manage_fridge_inventory' with action='scan'. Do not say "I cannot see", just trigger the tool.
      - INVENTORY: Carefully distinguish "I have" (Fridge) vs "I need" (Shopping).
      - GENERAL: Only use text replies (QUERY) for general knowledge questions (e.g. "How many calories in an egg?"). For everything else, USE A TOOL.
    `;

    // --- OPENAI CALL WITH TOOLS ---
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

    // --- RESPONSE HANDLING ---
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

      // 1. TIMER
      if (fnName === "manage_timer") {
        return NextResponse.json({
          intent: "TIMER",
          ...args, // action, label, seconds, id
        });
      }

      // 2. SHOPPING LIST
      if (fnName === "manage_shopping_list") {
        return NextResponse.json({
          intent: "SHOPPING_LIST",
          ...args, // action, item, quantity
        });
      }

      // 3. FRIDGE
      if (fnName === "manage_fridge_inventory") {
        return NextResponse.json({
          intent: "FRIDGE_INVENTORY",
          ...args, // action, items
        });
      }

      // 4. RECIPES (Suggestions)
      if (fnName === "generate_recipe_ideas") {
        return NextResponse.json({
          intent: "SUGGEST_RECIPE",
          data: {
            recipes: args.recipes,
            selectedRecipeTitle: null,
          },
        });
      }

      // 5. RECIPES (Selection)
      if (fnName === "select_recipe") {
        return NextResponse.json({
          intent: "SUGGEST_RECIPE",
          data: {
            recipes: [],
            selectedTitle: args.title,
          },
        });
      }

      // 6. RECIPES (Go Back)
      if (fnName === "deselect_recipe") {
        return NextResponse.json({
          intent: "SUGGEST_RECIPE",
          data: {
            recipes: [],
            selectedRecipeTitle: null,
          },
        });
      }

      // 7. START COOKING (Steps)
      if (fnName === "generate_cooking_steps") {
        return NextResponse.json({
          intent: "GENERATE_RECIPE",
          recipe: {
            title: args.title,
            steps: args.steps,
            ingredients: [],
          },
        });
      }

      // 8. NAVIGATION
      if (fnName === "navigate_steps") {
        return NextResponse.json({
          intent: "NAVIGATE",
          ...args, // direction, target
        });
      }
    }

    return NextResponse.json({
      intent: "QUERY",
      answer: message.content || "I didn't understand that command.",
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Brain freeze" }, { status: 500 });
  }
}
