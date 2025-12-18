import { NextResponse } from "next/server";
import OpenAI from "openai";

import { ALL_TOOLS } from "@/lib/tools/registry";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Main API Route for the AR Cooking Assistant.
 *
 * This endpoint acts as the central "Brain" of the application.
 * It follows a stateless Request/Response pattern where the frontend sends
 * the current full state of the application (timers, inventory, recipes) along with
 * the user's voice command.
 *
 * The route uses OpenAI's GPT-4o-mini model with Function Calling (Tools) to:
 * 1. Analyze the user's intent based on the provided context.
 * 2. Select the appropriate tool to manipulate the state (e.g., start a timer, find a recipe).
 * 3. Enforce strict behavioral rules defined in the System Prompt.
 *
 * @param req - The incoming HTTP request containing the JSON payload with `userSpeech` and app state snapshots.
 * @returns A JSON response containing the determined `intent` and specific action data for the frontend.
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
    // Converts raw JSON state arrays into human-readable strings for the LLM.
    // This allows the AI to "see" what the user sees in the AR interface.

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
    // 3. SYSTEM PROMPT DEFINITION
    // -------------------------------------------------------------------------
    // Injects the Persona, the Context, and the Critical Behavioral Rules.
    // This ensures the AI acts as a functional controller rather than a chatty bot.

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
      - RECIPES: When the user asks for food ideas, NEVER output a bulleted text list. You are an AR interface, not a chatbot. ALWAYS call 'generate_recipe_ideas' to display the visual cards.
      - INGREDIENTS MATCHING: When generating recipes, strictly compare the required ingredients with the "Fridge Inventory" context to populate 'ingredientsYouHave' and 'ingredientsMissing' accurately.
      - COOKING MODE: If the user says "Start cooking", call 'generate_cooking_steps'.
      - NAVIGATION: If the context shows a recipe is ACTIVE (Cooking Now), interpret "Next", "Back", or "Repeat" as 'navigate_steps', NOT as generic chat.
      - SAFETY: When generating steps, be paranoid about safety. Always flag hot items or raw meat in the 'warning' field.
      - SHOPPING ACTIONS: If the user says "Add [item]", ALWAYS use action='add'. Even if the item is already on the list, DO NOT use 'remove'. Only use 'remove' if the user explicitly says "remove", "delete", "check off", or "I bought/got it".
      - SHOPPING vs FRIDGE: Distinguish carefully between "I have" (Fridge Inventory) and "I need/buy" (Shopping List).
      - DATA EXTRACTION: When the user mentions multiple items (e.g. "butter and potatoes"), you MUST include ALL of them in the tool call's 'items' array. NEVER truncate the list.
      - LISTS: Never read the Shopping List or Recipe List aloud. Always use the corresponding TOOL ('manage_shopping_list' with action='show', or 'generate_recipe_ideas') to display the UI.
      - VISION: If the user says "Scan", "Look", or "See what I have", ALWAYS use 'manage_fridge_inventory' with action='scan'. Do not say "I cannot see", just trigger the tool.
      - GENERAL: Only use text replies (QUERY) for general knowledge questions (e.g. "Calories in egg?"). KEEP ANSWERS EXTREMELY CONCISE and in ENGLISH (Max 1-2 sentences). Be direct, no conversational filler or fluff.
      - UNIT CONVERSION: If the user asks for a unit conversion (e.g. F to C, Cups to Grams), perform the math accurately and reply with a concise text answer (QUERY).
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
      temperature: 0, // Deterministic output
    });

    const message = response.choices[0].message;

    // -------------------------------------------------------------------------
    // 5. INTENT MAPPING
    // -------------------------------------------------------------------------
    // Maps the AI's tool call to a specific frontend Intent string.

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
          ...args, // action, label, seconds, id
        });
      }

      // --- SHOPPING LIST MANAGEMENT ---
      if (fnName === "manage_shopping_list") {
        return NextResponse.json({
          intent: "SHOPPING_LIST",
          ...args, // action, item, quantity
        });
      }

      // --- FRIDGE INVENTORY MANAGEMENT ---
      if (fnName === "manage_fridge_inventory") {
        return NextResponse.json({
          intent: "FRIDGE_INVENTORY",
          ...args, // action, items
        });
      }

      // --- RECIPE SUGGESTIONS (GENERATION) ---
      if (fnName === "generate_recipe_ideas") {
        return NextResponse.json({
          intent: "SUGGEST_RECIPE",
          data: {
            recipes: args.recipes,
            selectedRecipeTitle: null,
          },
        });
      }

      // --- RECIPE PREVIEW (SELECTION) ---
      if (fnName === "select_recipe") {
        return NextResponse.json({
          intent: "SUGGEST_RECIPE",
          data: {
            recipes: [],
            selectedTitle: args.title,
          },
        });
      }

      // --- RECIPE EXIT (DESELECTION) ---
      if (fnName === "deselect_recipe") {
        return NextResponse.json({
          intent: "SUGGEST_RECIPE",
          data: {
            recipes: [],
            selectedRecipeTitle: null,
          },
        });
      }

      // --- COOKING SESSION (START) ---
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

      // --- COOKING NAVIGATION (STEPS) ---
      if (fnName === "navigate_steps") {
        return NextResponse.json({
          intent: "NAVIGATE",
          ...args, // direction, target
        });
      }
    }

    // -------------------------------------------------------------------------
    // 6. FALLBACK (QUERY)
    // -------------------------------------------------------------------------
    // If no tool was called, return the text response as a generic query answer.
    return NextResponse.json({
      intent: "QUERY",
      answer: message.content || "I didn't understand that command.",
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Brain freeze" }, { status: 500 });
  }
}
