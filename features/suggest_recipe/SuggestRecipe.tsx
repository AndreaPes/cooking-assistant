import React from "react";
import { Html } from "@react-three/drei";
import type { AIResponse } from "@/types/interfaces";

type Props = {
  data: AIResponse["data"]; // exactly the same shape as activeInterface.data
};

export function SuggestRecipe({ data }: Props) {
  const title = data.recipeTitle ?? "Recipe suggestion";
  const ingredientsYouHave = data.ingredientsYouHave ?? [];
  const ingredientsMissing = data.ingredientsMissing ?? [];
  const steps = data.steps ?? [];

  return (
    <group position={[1.5, 0, -2]}>
      <Html transform>
        <div className="bg-black/70 text-white rounded-2xl p-4 w-80 text-xs space-y-3">
          <header className="border-b border-white/20 pb-2 mb-2">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-[11px] text-gray-200">
              {data.estimatedTimeMinutes && <>⏱ {data.estimatedTimeMinutes} min </>}
              {data.difficulty && <>• {data.difficulty}</>}
            </p>
          </header>

          <section className="space-y-1">
            <h3 className="font-semibold text-[12px]">
              Ingredients you have
            </h3>
            <ul className="list-disc list-inside text-[11px] space-y-0.5">
              {ingredientsYouHave.length === 0 && (
                <li>No ingredients detected yet.</li>
              )}
              {ingredientsYouHave.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          {ingredientsMissing.length > 0 && (
            <section className="space-y-1">
              <h3 className="font-semibold text-[12px] text-yellow-300">
                Missing ingredients
              </h3>
              <ul className="list-disc list-inside text-[11px] space-y-0.5">
                {ingredientsMissing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-1">
            <h3 className="font-semibold text-[12px]">Steps</h3>
            <ol className="list-decimal list-inside text-[11px] space-y-0.5 max-h-40 overflow-auto pr-1">
              {steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </section>
        </div>
      </Html>
    </group>
  );
}
