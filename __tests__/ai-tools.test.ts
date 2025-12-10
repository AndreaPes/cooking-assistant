import { describe, it, expect } from "vitest";
import { FRIDGE_TOOLS } from "@/features/fridge/fridge.tools";
import { SHOPPING_TOOLS } from "@/features/shopping/shopping.tools";
import { RECIPE_TOOLS } from "@/features/cooking/recipes/recipe.tools";
import { COOKING_TOOLS } from "@/features/cooking/steps/step.tools";

/**
 * AI Tools Integrity Test Suite
 * -----------------------------
 * Ensures that the Function Calling definitions sent to OpenAI contain
 * the critical safety and behavioral rules required by the application.
 */
describe("AI Tools Integrity", () => {
  // --- FRIDGE TOOLS ---
  it("Fridge Tool should enforce visual scanning logic", () => {
    const scanTool = FRIDGE_TOOLS[0];

    // 1. Check General Description
    const mainDescription = scanTool.function.description;
    expect(mainDescription).toContain("I HAVE [item]");

    // 2. Check Action Parameter Description (Where the Camera logic lives)
    // @ts-ignore - TS might complain about deep nesting access without types
    const actionDescription =
      scanTool.function.parameters.properties.action.description;
    expect(actionDescription).toContain("ACTIVATES THE CAMERA");
  });

  // --- SHOPPING TOOLS ---
  it("Shopping Tool should forbid text-to-speech reading of lists", () => {
    const shopTool = SHOPPING_TOOLS[0];
    const description = shopTool.function.description;

    expect(description).toContain("NEVER read the list aloud");
    expect(description).toContain("use action='show'");
  });

  // --- RECIPE TOOLS ---
  it("Recipe Tool should enforce visual cards and strict quantity", () => {
    const recipeTool = RECIPE_TOOLS[0]; // generate_recipe_ideas
    const description = recipeTool.function.description;

    // UI Constraint: Cards only
    expect(description).toContain("NEVER list recipes in a text reply");

    // UI Constraint: Grid layout requires exactly 4 items
    // (Updated to match exact string in file: "exactly 4 options")
    expect(description).toContain("exactly 4 options");
  });

  it("Recipe Tool should include logic for Fridge vs Shopping validation", () => {
    const recipeTool = RECIPE_TOOLS[0];
    const description = recipeTool.function.description;

    expect(description).toContain("Check 'Fridge Inventory' in context");
  });

  // --- COOKING STEP TOOLS ---
  it("Cooking Steps should enforce safety warnings", () => {
    const stepTool = COOKING_TOOLS[0]; // generate_cooking_steps
    const description = stepTool.function.description;

    expect(description).toContain("Detect Safety Hazards aggressively");
  });

  it("Cooking Steps should handle timer ranges correctly", () => {
    const stepTool = COOKING_TOOLS[0];
    // Access the 'timerSeconds' parameter description
    // @ts-ignore
    const timerDesc =
      stepTool.function.parameters.properties.steps.items.properties
        .timerSeconds.description;

    expect(timerDesc).toContain("ALWAYS use the LOWER value");
  });
});
