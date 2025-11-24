// features/suggest_recipe/SuggestRecipe.tsx
import React from "react";
import { Html } from "@react-three/drei";
import { useCookingState } from "@/state/cookingState";
import type {
  RecipeSuggestionData,
  IngredientDetailed,
  StepTimer,
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

export function SuggestRecipe({ data }: Props) {
  const { addTimer } = useCookingState();

  if (!data) {
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

  const {
    recipeTitle,
    ingredientsYouHave = [],
    ingredientsMissing = [],
    ingredientsDetailed = [],
    steps = [],
    stepTimers = [],
    estimatedTimeMinutes,
    difficulty,
  } = data;

  // Split detailed ingredients into "you have" vs "extra"
  const haveDetailed = ingredientsDetailed.filter((i) => i.fromUserIngredients);
  const extraDetailed = ingredientsDetailed.filter((i) => !i.fromUserIngredients);

  // Fallback if model forgot ingredientsDetailed
  const haveFallback =
    haveDetailed.length === 0 && ingredientsYouHave.length > 0;
  const extraFallback =
    extraDetailed.length === 0 && ingredientsMissing.length > 0;

  // Group timers by step index
  const timersByStep = new Map<number, StepTimer[]>();
  stepTimers.forEach((t) => {
    const arr = timersByStep.get(t.stepIndex) ?? [];
    arr.push(t);
    timersByStep.set(t.stepIndex, arr);
  });

  return (
    <group position={[1.5, 0, -2]}>
      <Html transform>
        <div className="bg-black/70 text-white rounded-2xl p-4 w-80 text-xs space-y-3">
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
                Extra ingredients
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
