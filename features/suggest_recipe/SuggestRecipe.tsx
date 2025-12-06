import React, { useState, useEffect } from "react";
import { Html } from "@react-three/drei";
import { useCookingState } from "@/state/cookingState";

import type {
  RecipeSuggestionData,
  IngredientDetailed,
  SingleRecipe,
} from "@/types/interfaces";

type Props = {
  data: RecipeSuggestionData | null;
};

// --- HELPER FUNCTIONS ---
function formatIngredient(ing: IngredientDetailed, isExtra: boolean) {
  const hasQty = ing.quantity !== undefined && ing.unit;
  const base = hasQty ? `${ing.quantity} ${ing.unit} ${ing.name}` : ing.name;
  return isExtra ? `${base}` : base;
}

function getPreviewIngredients(recipe: SingleRecipe) {
  const {
    ingredientsDetailed = [],
    ingredientsYouHave = [],
    ingredientsMissing = [],
  } = recipe;

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
  // Access global store to sync selection state
  const { setSuggestion, setSelectedSuggestionIndex } = useCookingState();

  // Local UI state
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // --- SYNC EFFECTS ---

  // 1. Sync Data from Parent
  useEffect(() => {
    if (!data || !data.recipes || data.recipes.length === 0) {
      setSuggestion(null);
      setSelectedSuggestionIndex(null);
    } else {
      setSuggestion(data);
    }
  }, [data, setSuggestion, setSelectedSuggestionIndex]);

  // 2. Handle Auto-Selection via Voice (e.g. "Open the first one")
  useEffect(() => {
    if (!data || !data.recipes || data.recipes.length === 0) {
      setSelectedIndex(null);
      setSelectedSuggestionIndex(null);
      return;
    }

    if (data.selectedRecipeTitle) {
      const target = data.selectedRecipeTitle.toLowerCase();
      const idx = data.recipes.findIndex(
        (r) => r.recipeTitle && r.recipeTitle.toLowerCase().includes(target),
      );
      if (idx >= 0) {
        setSelectedIndex(idx);
        setSelectedSuggestionIndex(idx); // Update global store context
        return;
      }
    } else {
      setSelectedIndex(null);
      setSelectedSuggestionIndex(null);
    }
  }, [data, setSelectedSuggestionIndex]);

  // --- RENDER LOGIC ---

  if (!data || !data.recipes || data.recipes.length === 0) {
    return (
      <group position={[1.5, 0, -2]}>
        <Html transform>
          <div className="bg-black/60 text-white rounded-2xl p-4 w-80 text-xs space-y-2 select-none pointer-events-none border border-white/10 backdrop-blur-md">
            <h2 className="text-lg font-semibold mb-1 text-gray-300">
              Recipe Assistant
            </h2>
            <p className="opacity-80 italic">
              &#34;I have eggs and pasta. What can I cook?&#34;
            </p>
          </div>
        </Html>
      </group>
    );
  }

  const recipes = data.recipes;

  // === SCREEN 1: LIST VIEW ===
  if (selectedIndex === null) {
    return (
      <group position={[1.5, 0, -2]}>
        <Html transform>
          <div className="bg-black/70 text-white rounded-2xl p-4 w-80 text-xs space-y-3">
            <header className="border-b text-orange-400 border-white/20 pb-2 mb-1">
              <h2 className="text-lg font-semibold">Suggestions</h2>
            </header>

            <div className="space-y-2 max-h-96 overflow-auto pr-1">
              {recipes.map((r, idx) => {
                const { havePreview, extraPreview } = getPreviewIngredients(r);
                return (
                  <div
                    key={idx}
                    className="w-full text-left bg-white/5 border border-white/10 rounded-xl px-4 py-3 space-y-1 relative"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <h3 className="text-sm font-semibold">
                        {r.recipeTitle ?? `Recipe ${idx + 1}`}
                      </h3>
                      <span className="text-[10px] text-gray-200 whitespace-nowrap uppercase">
                        {r.estimatedTimeMinutes && (
                          <>⏱ {r.estimatedTimeMinutes} min </>
                        )}
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
                  </div>
                );
              })}
            </div>
          </div>
        </Html>
      </group>
    );
  }

  // === SCREEN 2: DETAIL VIEW ===
  const selectedRecipe = recipes[Math.min(selectedIndex, recipes.length - 1)];
  const {
    recipeTitle,
    ingredientsYouHave = [],
    ingredientsMissing = [],
    ingredientsDetailed = [],
    estimatedTimeMinutes,
    difficulty,
  } = selectedRecipe;

  const haveDetailed = ingredientsDetailed.filter((i) => i.fromUserIngredients);
  const extraDetailed = ingredientsDetailed.filter(
    (i) => !i.fromUserIngredients,
  );
  const haveFallback =
    haveDetailed.length === 0 && ingredientsYouHave.length > 0;
  const extraFallback =
    extraDetailed.length === 0 && ingredientsMissing.length > 0;

  return (
    <group position={[1.5, 0, -2]}>
      <Html transform>
        <div className="bg-black/80 backdrop-blur-xl text-white rounded-[2rem] p-6 w-96 text-xs space-y-4 shadow-[0_0_60px_rgba(0,0,0,0.6)] border border-white/20 animate-in fade-in zoom-in duration-300">
          {/* HEADER */}
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-2xl font-black text-orange-400 leading-tight mb-1">
              {recipeTitle ?? "Recipe suggestion"}
            </h2>
            <div className="flex items-center gap-4 text-[11px] text-gray-300 uppercase tracking-wider font-medium">
              {estimatedTimeMinutes && (
                <span className="flex items-center gap-1">
                  ⏱ {estimatedTimeMinutes} min
                </span>
              )}
              {difficulty && <span>• {difficulty}</span>}
            </div>
          </div>

          {/* INGREDIENTS */}
          <div className="space-y-5 max-h-[350px] overflow-y-auto pr-2">
            {/* Have */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                <h3 className="font-bold text-[11px] uppercase tracking-widest text-white/80">
                  You Have
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {haveDetailed.map((ing) => (
                  <div
                    key={ing.name}
                    className="bg-white/5 rounded-lg px-3 py-2 border border-white/5 text-gray-200 font-medium"
                  >
                    {formatIngredient(ing, false)}
                  </div>
                ))}
                {haveFallback &&
                  ingredientsYouHave.map((name) => (
                    <div
                      key={name}
                      className="bg-white/5 rounded-lg px-3 py-2 border border-white/5 text-gray-200"
                    >
                      {name}
                    </div>
                  ))}
              </div>
            </section>

            {/* Missing */}
            {(extraDetailed.length > 0 || extraFallback) && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]"></div>
                  <h3 className="font-bold text-[11px] uppercase tracking-widest text-white/80">
                    Missing
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {extraDetailed.map((ing) => (
                    <div
                      key={ing.name}
                      className="bg-red-500/10 text-red-100 rounded-lg px-3 py-2 border border-red-500/20 font-medium"
                    >
                      {formatIngredient(ing, true)}
                    </div>
                  ))}
                  {extraFallback &&
                    ingredientsMissing.map((name) => (
                      <div
                        key={name}
                        className="bg-red-500/10 text-red-100 rounded-lg px-3 py-2 border border-red-500/20"
                      >
                        {name}
                      </div>
                    ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </Html>
    </group>
  );
}
