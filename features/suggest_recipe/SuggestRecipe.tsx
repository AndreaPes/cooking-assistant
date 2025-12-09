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
    if (data.selectedTitle) {
      const target = data.selectedTitle.toLowerCase();
      const idx = data.recipes.findIndex(
        (r) => r.title && r.title.toLowerCase().includes(target),
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

  // SCREEN 1: OVERVIEW
  if (selectedIndex === null) {
    return (
      // Position: Centered in front of user
      <group position={[0, 0, -1.5]}>
        <Html transform occlude center scale={0.4}>
          <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl min-w-[400px] w-fit max-w-[600px] flex flex-col gap-6">
            {/* Header */}
            <header className="flex justify-between items-end border-b border-white/10 pb-4">
              <div>
                <span className="text-[11px] text-white/40 font-bold tracking-[0.2em] uppercase mb-1 block">
                  COOKING ASSISTANT
                </span>
                <h2 className="text-3xl font-black text-orange-500 tracking-tight leading-none">
                  SUGGESTIONS
                </h2>
              </div>
            </header>

            {/* Vertical Stack Container */}
            <div className="flex flex-col gap-3">
              {recipes.map((r, idx) => {
                return (
                  <div
                    key={idx}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors group"
                  >
                    {/* Left: Index & Info */}
                    <div className="flex items-center gap-4">
                      {/* Badge Number */}
                      <span className="text-orange-500/80 font-mono text-lg font-bold bg-orange-500/10 px-3 py-1.5 rounded-lg">
                        #{idx + 1}
                      </span>

                      {/* Title & Stats */}
                      <div className="flex flex-col">
                        <h3 className="text-lg font-bold text-white leading-tight line-clamp-1 group-hover:text-orange-400 transition-colors">
                          {r.title}
                        </h3>

                        <div className="flex gap-3 text-[10px] text-white/40 font-bold uppercase tracking-wide mt-1">
                          {r.estimatedTimeMinutes && (
                            <span className="flex items-center gap-1">
                              ⏱ {r.estimatedTimeMinutes} MIN
                            </span>
                          )}
                          {r.difficulty && (
                            <span className="flex items-center gap-1">
                              ⚡ {r.difficulty}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Arrow Indicator */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20">
                      →
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

  // SCREEN 2: DETAIL VIEW
  const selectedRecipe = recipes[Math.min(selectedIndex, recipes.length - 1)];
  const {
    title,
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
              {title}
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
