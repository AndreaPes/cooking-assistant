// features/suggest_recipe/SuggestRecipe.tsx
import React, { useState, useEffect } from "react";
import { Html } from "@react-three/drei";
import { useCookingState } from "@/state/cookingState";
import type {
  RecipeSuggestionData,
  IngredientDetailed,
  StepTimer,
  SingleRecipe,
} from "@/types/interfaces";

type Props = {
  data: RecipeSuggestionData | null;
};

function formatIngredient(ing: IngredientDetailed, isExtra: boolean) {
  const hasQty = ing.quantity !== undefined && ing.unit;
  const base = hasQty ? `${ing.quantity} ${ing.unit} ${ing.name}` : ing.name;
  return isExtra ? `${base} (extra)` : base;
}

// Remove "Step 1:" / "Step 2:" prefixes from the text
function cleanStepText(text: string) {
  return text.replace(/^Step\s*\d+\s*:?\s*/i, "").trim();
}

function buildTimersByStep(stepTimers: StepTimer[] = []) {
  const timersByStep = new Map<number, StepTimer[]>();
  stepTimers.forEach((t) => {
    const arr = timersByStep.get(t.stepIndex) ?? [];
    arr.push(t);
    timersByStep.set(t.stepIndex, arr);
  });
  return timersByStep;
}

// For preview cards: build short text lists
function getPreviewIngredients(recipe: SingleRecipe) {
  const { ingredientsDetailed = [], ingredientsYouHave = [], ingredientsMissing = [] } =
    recipe;

  const haveNames =
    ingredientsDetailed.length > 0
      ? ingredientsDetailed
          .filter((i) => i.fromUserIngredients)
          .map((i) => i.name)
      : ingredientsYouHave;

  const extraNames =
    ingredientsDetailed.length > 0
      ? ingredientsDetailed
          .filter((i) => !i.fromUserIngredients)
          .map((i) => i.name)
      : ingredientsMissing;

  return {
    havePreview: haveNames.slice(0, 3).join(", "),
    extraPreview: extraNames.slice(0, 2).join(", "),
  };
}

export function SuggestRecipe({ data }: Props) {
  const { addTimer } = useCookingState();

  if (!data || !data.recipes || data.recipes.length === 0) {
    return (
      <group position={[1.5, 0, -2]}>
        <Html transform>
          <div className="bg-black/70 text-white rounded-2xl p-4 w-80 text-xs space-y-2">
            <h2 className="text-lg font-semibold mb-1">Recipe Suggestions</h2>
            <p>
              Tell me what ingredients you have, for example:
              <br />
              <span className="italic">
                “I have eggs, cheese and pasta. Suggest me a recipe.”
              </span>
            </p>
          </div>
        </Html>
      </group>
    );
  }

  const recipes: SingleRecipe[] = data.recipes;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // If the AI specifies a recipe to open (selectedRecipeTitle),
  // auto-select it when new data arrives.
  useEffect(() => {
    if (!data || !data.recipes || data.recipes.length === 0) {
      setSelectedIndex(null);
      return;
    }

    if (data.selectedRecipeTitle) {
      const target = data.selectedRecipeTitle.toLowerCase();
      const idx = data.recipes.findIndex(
        (r) =>
          r.recipeTitle &&
          r.recipeTitle.toLowerCase().includes(target),
      );
      if (idx >= 0) {
        setSelectedIndex(idx);
        return;
      }
    }

    // If no specific recipe requested, show overview list
    setSelectedIndex(null);
  }, [data]);

  // === SCREEN 1: OVERVIEW WITH PREVIEW CARDS ===
  if (selectedIndex === null) {
    return (
      <group position={[1.5, 0, -2]}>
        <Html transform>
          <div className="bg-black/70 text-white rounded-2xl p-4 w-80 text-xs space-y-3">
            <header className="border-b border-white/20 pb-2 mb-1">
              <h2 className="text-lg font-semibold">Recipe suggestions</h2>
            </header>

            <div className="space-y-2 max-h-96 overflow-auto pr-1">
              {recipes.map((r, idx) => {
                const { havePreview, extraPreview } = getPreviewIngredients(r);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/15 rounded-2xl px-3 py-2 space-y-1 cursor-pointer"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <h3 className="text-sm font-semibold">
                        {r.recipeTitle ?? `Recipe ${idx + 1}`}
                      </h3>
                      <span className="text-[10px] text-gray-200 whitespace-nowrap">
                        {r.estimatedTimeMinutes && <>⏱ {r.estimatedTimeMinutes} min </>}
                        {r.difficulty && <>• {r.difficulty}</>}
                      </span>
                    </div>

                    {havePreview && (
                      <p className="text-[10px] text-gray-200">
                        <span className="font-semibold">You have:</span>{" "}
                        {havePreview}
                        {havePreview.split(",").length >= 3 && "…"}
                      </p>
                    )}

                    {extraPreview && (
                      <p className="text-[10px] text-yellow-300">
                        <span className="font-semibold">Missing:</span>{" "}
                        {extraPreview}
                        {extraPreview.split(",").length >= 2 && "…"}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Html>
      </group>
    );
  }

  // === SCREEN 2: DETAIL VIEW FOR SELECTED RECIPE ===
  const selectedRecipe = recipes[Math.min(selectedIndex, recipes.length - 1)];

  const {
    recipeTitle,
    ingredientsYouHave = [],
    ingredientsMissing = [],
    ingredientsDetailed = [],
    steps = [],
    stepTimers = [],
    estimatedTimeMinutes,
    difficulty,
  } = selectedRecipe;

  const haveDetailed = ingredientsDetailed.filter((i) => i.fromUserIngredients);
  const extraDetailed = ingredientsDetailed.filter((i) => !i.fromUserIngredients);

  const haveFallback =
    haveDetailed.length === 0 && ingredientsYouHave.length > 0;
  const extraFallback =
    extraDetailed.length === 0 && ingredientsMissing.length > 0;

  const timersByStep = buildTimersByStep(stepTimers);

  return (
    <group position={[1.5, 0, -2]}>
      <Html transform>
        <div className="bg-black/70 text-white rounded-2xl p-4 w-80 text-xs space-y-3">
          {/* BACK BUTTON */}
          <button
            type="button"
            onClick={() => setSelectedIndex(null)}
            className="text-[10px] mb-1 px-2 py-1 rounded-full border border-white/30 text-white/80 hover:bg-white/10"
          >
            ← Back to recipe list
          </button>

          {/* HEADER */}
          <header className="border-b border-white/20 pb-2 mb-2">
            <h2 className="text-lg font-semibold">
              {recipeTitle ?? "Recipe suggestion"}
            </h2>
            <p className="text-[11px] text-gray-200">
              {estimatedTimeMinutes && <>⏱ {estimatedTimeMinutes} min </>}
              {difficulty && <>• {difficulty}</>}
            </p>
          </header>

          {/* INGREDIENTS YOU HAVE */}
          <section className="space-y-1">
            <h3 className="font-semibold text-[12px]">Ingredients you have</h3>
            <ul className="list-disc list-inside text-[11px] space-y-0.5">
              {haveDetailed.length === 0 && !haveFallback && (
                <li>No ingredients detected yet.</li>
              )}

              {haveDetailed.map((ing) => (
                <li key={`have-${ing.name}-${ing.unit}`}>
                  {formatIngredient(ing, false)}
                </li>
              ))}

              {haveFallback &&
                ingredientsYouHave.map((name) => (
                  <li key={`have-fallback-${name}`}>{name}</li>
                ))}
            </ul>
          </section>

          {/* EXTRA INGREDIENTS */}
          {(extraDetailed.length > 0 || extraFallback) && (
            <section className="space-y-1">
              <h3 className="font-semibold text-[12px] text-yellow-300">
                Missing ingredients
              </h3>
              <ul className="list-disc list-inside text-[11px] space-y-0.5">
                {extraDetailed.map((ing) => (
                  <li key={`extra-${ing.name}-${ing.unit}`}>
                    {formatIngredient(ing, true)}
                  </li>
                ))}

                {extraFallback &&
                  ingredientsMissing.map((name) => (
                    <li key={`extra-fallback-${name}`}>{name} (extra)</li>
                  ))}
              </ul>
            </section>
          )}

          {/* STEPS + CLICKABLE TIMERS */}
          <section className="space-y-1">
            <h3 className="font-semibold text-[12px]">Steps</h3>
            <ol className="text-[11px] space-y-1 max-h-80 overflow-auto pr-1">
              {steps.map((rawStep, index) => {
                const stepIndex = index + 1;
                const timersForStep = timersByStep.get(stepIndex) ?? [];
                const stepText = cleanStepText(rawStep);

                return (
                  <li key={index} className="space-y-0.5">
                    <div className="flex justify-between gap-2 items-center">
                      <span>
                        <span className="font-semibold mr-1">
                          {stepIndex}.
                        </span>
                        {stepText}
                      </span>

                      {timersForStep.length > 0 && (
                        <div className="flex flex-col items-end gap-0.5 text-[10px] text-yellow-300">
                          {timersForStep.map((t, i) => (
                            <button
                              key={i}
                              type="button"
                              className="border border-yellow-400/60 rounded-full px-2 py-0.5 whitespace-nowrap cursor-pointer hover:bg-yellow-400/20"
                              onClick={() => {
                                const minutes = Number(t.minutes) || 0;
                                if (minutes > 0) {
                                  addTimer(
                                    minutes * 60,
                                    t.label || `Step ${stepIndex} timer`,
                                  );
                                }
                              }}
                            >
                              ⏱ {t.minutes} min
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </Html>
    </group>
  );
}
