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
  return base;
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
  const { setSuggestion, setSelectedSuggestionIndex } = useCookingState();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // --- SYNC EFFECTS ---
  useEffect(() => {
    if (!data || !data.recipes || data.recipes.length === 0) {
      setSuggestion(null);
      setSelectedSuggestionIndex(null);
    } else {
      setSuggestion(data);
    }
  }, [data, setSuggestion, setSelectedSuggestionIndex]);

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
        setSelectedSuggestionIndex(idx);
        return;
      }
    } else {
      setSelectedIndex(null);
      setSelectedSuggestionIndex(null);
    }
  }, [data, setSelectedSuggestionIndex]);

  if (!data || !data.recipes || data.recipes.length === 0) return null;

  const recipes = data.recipes;

  // ===========================================================================
  // SCREEN 1: LIST VIEW (OVERVIEW) - CENTERED GRID
  // ===========================================================================
  if (selectedIndex === null) {
    return (
      // POSIZIONE: Centrale [0, 0, -1.5]
      <group position={[0, 0, -1.5]}>
        <Html transform occlude center scale={0.4}>
          <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl w-[1000px] max-w-[95vw] flex flex-col gap-6">
            {/* Header */}
            <header className="flex justify-between items-end border-b border-white/10 pb-4">
              <div>
                <span className="text-[11px] text-white/40 font-bold tracking-[0.2em] uppercase mb-1 block">
                  COOKING ASSISTANT
                </span>
                <h2 className="text-4xl font-black text-orange-500 tracking-tight leading-none">
                  SUGGESTIONS
                </h2>
              </div>
            </header>

            {/* Grid Container - NO SCROLLBAR, FLEX WRAP */}
            <div className="flex flex-wrap gap-4 justify-center items-stretch">
              {recipes.map((r, idx) => {
                const { havePreview, extraPreview } = getPreviewIngredients(r);
                return (
                  <div
                    key={idx}
                    className="flex-1 min-w-[220px] max-w-[48%] bg-black/40 border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:bg-white/5 transition-colors group"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-orange-500/80 font-mono text-xs font-bold bg-orange-500/10 px-2 py-1 rounded-md">
                          #{idx + 1}
                        </span>
                        <div className="flex gap-2 text-[10px] text-white/40 font-bold uppercase tracking-wide">
                          {r.estimatedTimeMinutes && (
                            <span>{r.estimatedTimeMinutes}M</span>
                          )}
                          {r.difficulty && <span>• {r.difficulty}</span>}
                        </div>
                      </div>

                      {/* TITOLO: Break words per evitare overflow */}
                      <h3 className="text-xl font-bold text-white leading-tight mb-3 line-clamp-2 break-words group-hover:text-orange-400 transition-colors">
                        {r.recipeTitle}
                      </h3>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-white/5">
                      {havePreview && (
                        <div>
                          <span className="text-[9px] text-green-400/60 font-bold uppercase tracking-widest block mb-0.5">
                            YOU HAVE
                          </span>
                          <p className="text-xs text-white/80 leading-relaxed line-clamp-2 break-words capitalize">
                            {havePreview}
                          </p>
                        </div>
                      )}
                      {extraPreview && (
                        <div>
                          <span className="text-[9px] text-red-400/60 font-bold uppercase tracking-widest block mb-0.5">
                            MISSING
                          </span>
                          <p className="text-xs text-red-300/80 leading-relaxed line-clamp-1 break-words capitalize">
                            {extraPreview}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Html>
      </group>
    );
  }

  // ===========================================================================
  // SCREEN 2: DETAIL VIEW (BIG DASHBOARD) - CENTERED
  // ===========================================================================
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
    <group position={[0, 0, -1.5]}>
      <Html transform occlude center scale={0.4}>
        <div className="w-[1000px] bg-gray-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 flex gap-10 shadow-[0_0_80px_rgba(0,0,0,0.8)] animate-in zoom-in duration-300 max-w-[95vw]">
          {/* LEFT: INFO & ACTIONS */}
          <div className="flex-1 flex flex-col">
            <span className="text-[11px] text-white/40 font-bold tracking-[0.2em] uppercase mb-2">
              SELECTED RECIPE
            </span>
            <h1 className="text-5xl font-black text-orange-500 leading-tight mb-6 tracking-tight break-words">
              {recipeTitle}
            </h1>

            <div className="flex gap-4 mb-8">
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <span className="text-white/40 text-xs font-bold uppercase tracking-wider">
                  TIME
                </span>
                <span className="text-white font-mono font-bold text-lg">
                  {estimatedTimeMinutes || "--"}m
                </span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <span className="text-white/40 text-xs font-bold uppercase tracking-wider">
                  DIFFICULTY:
                </span>
                <span className="text-white font-mono font-bold text-lg uppercase">
                  {difficulty || "MED"}
                </span>
              </div>
            </div>

            <div className="mt-auto bg-black/40 rounded-2xl p-6 border border-white/5 shadow-inner">
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest block mb-2">
                COMMAND
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-white/60 text-lg">Say</span>
                <span className="text-3xl font-bold text-white">
                  &#34;Start Cooking&#34;
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: INGREDIENTS */}
          <div className="w-[380px] bg-black/20 rounded-3xl p-6 border border-white/5 flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <span className="text-[11px] text-white/40 font-bold tracking-[0.2em] uppercase">
                INGREDIENTS
              </span>
            </div>

            <div className="overflow-y-auto pr-2 space-y-2 custom-scrollbar flex-1 capitalize">
              {/* AVAILABLE */}
              {haveDetailed.map((ing, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-2 px-3 bg-green-500/5 rounded-lg border border-green-500/10"
                >
                  <span className="text-green-100 font-medium text-sm break-words">
                    {ing.name}
                  </span>
                  <span className="text-green-100/50 text-xs font-mono whitespace-nowrap ml-2">
                    {ing.quantity || ""} {ing.unit || ""}
                  </span>
                </div>
              ))}
              {haveFallback &&
                ingredientsYouHave.map((name, i) => (
                  <div
                    key={`have-${i}`}
                    className="py-2 px-3 bg-green-500/5 rounded-lg border border-green-500/10 text-green-100 font-medium text-sm break-words"
                  >
                    {name}
                  </div>
                ))}

              {/* MISSING */}
              {(extraDetailed.length > 0 || extraFallback) && (
                <div className="pt-4 mt-2">
                  <span className="text-[10px] text-red-400/50 font-bold uppercase tracking-widest block mb-3 pl-1">
                    MISSING ITEMS
                  </span>
                  <div className="space-y-2">
                    {extraDetailed.map((ing, i) => (
                      <div
                        key={`miss-${i}`}
                        className="flex justify-between items-center py-2 px-3 bg-red-500/5 rounded-lg border border-red-500/10 opacity-80"
                      >
                        <span className="text-red-200 font-medium text-sm break-words">
                          {ing.name}
                        </span>
                        <span className="text-red-200/50 text-xs font-mono whitespace-nowrap ml-2">
                          {ing.quantity || ""} {ing.unit || ""}
                        </span>
                      </div>
                    ))}
                    {extraFallback &&
                      ingredientsMissing.map((name, i) => (
                        <div
                          key={`miss-fb-${i}`}
                          className="py-2 px-3 bg-red-500/5 rounded-lg border border-red-500/10 text-red-200 font-medium text-sm opacity-80 break-words"
                        >
                          {name}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}
