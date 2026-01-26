import { useRef, useState, useEffect, useMemo } from "react";
import { RoundedBox, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, Quaternion, Vector3 } from "three";
import { useCookingState } from "@/state/cookingState";
import { useShoppingState } from "@/state/shoppingState";
import type { RecipeSuggestionData } from "@/types/interfaces";

interface SuggestRecipeProps {
  /**
   * The data object containing recipe suggestions and the currently selected recipe title.
   */
  data: RecipeSuggestionData | null;
}

/**
 * A 3D interactive panel for displaying AI-generated recipe suggestions.
 *
 * Modes:
 * 1) Overview Mode: Displays 4 suggested recipes.
 * 2) Detail Mode: Shows details + ingredients match.
 *
 * Improvements:
 * - If ingredientsDetailed exists -> trust fromUserIngredients flags.
 * - Otherwise fallback to shopping list fuzzy match.
 * - Head-locked positioning.
 */
export function SuggestRecipe({ data }: SuggestRecipeProps) {
  const rootRef = useRef<Group>(null);
  const panelRef = useRef<Group>(null);

  const tmpPos = useRef(new Vector3()).current;
  const tmpQuat = useRef(new Quaternion()).current;

  const { setSuggestion, setSelectedSuggestionIndex } = useCookingState();
  const { items: shoppingItems } = useShoppingState();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Keep global cooking state synced
  useEffect(() => {
    if (!data || !data.recipes?.length) {
      setSuggestion(null);
      setSelectedSuggestionIndex(null);
      return;
    }

    setSuggestion(data);
  }, [data, setSuggestion, setSelectedSuggestionIndex]);

  // Select recipe by title if assistant sends selectedTitle
  useEffect(() => {
    if (!data?.recipes?.length) {
      setSelectedIndex(null);
      setSelectedSuggestionIndex(null);
      return;
    }

    const recipes = data.recipes.slice(0, 4);

    if (data.selectedTitle) {
      const target = data.selectedTitle.toLowerCase().trim();

      const idx = recipes.findIndex((r) => {
        const t = (r.title ?? "").toLowerCase().trim();
        return t === target || t.includes(target) || target.includes(t);
      });

      if (idx >= 0) {
        setSelectedIndex(idx);
        setSelectedSuggestionIndex(idx);
        return;
      }
    }

    setSelectedIndex(null);
    setSelectedSuggestionIndex(null);
  }, [data, setSelectedSuggestionIndex]);

  // Head-locked UI
  useFrame((state) => {
    if (!rootRef.current) return;

    const camAny: any = state.camera;
    const cam = camAny.isArrayCamera ? camAny.cameras[0] : camAny;

    cam.getWorldPosition(tmpPos);
    cam.getWorldQuaternion(tmpQuat);

    rootRef.current.position.copy(tmpPos);
    rootRef.current.quaternion.copy(tmpQuat);
    rootRef.current.frustumCulled = false;
  });

  // No suggestions -> no UI
  if (!data || !data.recipes?.length) return null;

  const recipes = data.recipes.slice(0, 4);

  // -----------------------------
  // OVERVIEW MODE
  // -----------------------------
  if (selectedIndex === null) {
    return (
      <group ref={rootRef} frustumCulled={false} renderOrder={997}>
        <group position={[0, -0.2, -1]} scale={0.75}>
          <group ref={panelRef}>
            <RoundedBox args={[0.75, 0.75, 0]} radius={0.07}>
              <meshStandardMaterial
                color="#111827"
                transparent
                opacity={0.75}
                depthTest={false}
                depthWrite={false}
              />
            </RoundedBox>

            <Text
              position={[0, 0.24, 0.03]}
              fontSize={0.045}
              color="#fb923c"
              anchorX="center"
            >
              SUGGESTED RECIPES
            </Text>

            {recipes.map((r, i) => (
              <Text
                key={i}
                position={[0, 0.14 - i * 0.09, 0.03]}
                fontSize={0.038}
                maxWidth={0.75}
                anchorX="center"
                color="white"
              >
                {`${i + 1}. ${r.title}`}
              </Text>
            ))}
          </group>
        </group>
      </group>
    );
  }

  // -----------------------------
  // DETAIL MODE
  // -----------------------------
  const recipe = recipes[Math.min(selectedIndex, recipes.length - 1)];

  const { have, missing } = useMemo(() => {
    const detailed = recipe.ingredientsDetailed ?? [];

    // If we have a detailed ingredient list with flags, trust it
    if (detailed.length > 0) {
      const haveList = detailed
        .filter((i) => i.fromUserIngredients)
        .map((i) => i.name);

      const missingList = detailed
        .filter((i) => !i.fromUserIngredients)
        .map((i) => i.name);

      return { have: haveList, missing: missingList };
    }

    // Fallback: use ingredientsYouHave/ingredientsMissing or derive from shopping list
    const all = [
      ...(recipe.ingredientsYouHave || []),
      ...(recipe.ingredientsMissing || []),
    ];

    const haveList = all.filter((ingName) => {
      const ing = ingName.toLowerCase();
      return shoppingItems.some((item) => {
        const it = item.label.toLowerCase();
        return ing.includes(it) || it.includes(ing);
      });
    });

    const missingList = all.filter((ingName) => !haveList.includes(ingName));

    return { have: haveList, missing: missingList };
  }, [recipe, shoppingItems]);

  return (
    <group ref={rootRef} frustumCulled={false} renderOrder={997}>
      <group position={[0, -0.25, -1]} scale={0.7}>
        <group ref={panelRef}>
          <RoundedBox args={[1.25, 0.95, 0.04]} radius={0.08}>
            <meshStandardMaterial
              color="#111827"
              transparent
              opacity={0.9}
              depthTest={false}
              depthWrite={false}
            />
          </RoundedBox>

          <Text
            position={[0, 0.38, 0.03]}
            fontSize={0.05}
            color="#fb923c"
            maxWidth={1.1}
            anchorX="center"
          >
            {recipe.title}
          </Text>

          <Text
            position={[0, 0.28, 0.03]}
            fontSize={0.035}
            color="white"
            anchorX="center"
          >
            {`⏱ ${recipe.estimatedTimeMinutes ?? "--"} min   ⚡ ${
              recipe.difficulty?.toUpperCase() ?? "MED"
            }`}
          </Text>

          {/* HAVE */}
          <Text
            position={[-0.5, 0.18, 0.03]}
            fontSize={0.03}
            color="#4ade80"
            anchorX="left"
          >
            YOU HAVE
          </Text>

          {have.length === 0 && (
            <Text
              position={[-0.5, 0.12, 0.03]}
              fontSize={0.03}
              color="#9ca3af"
              anchorX="left"
            >
              —
            </Text>
          )}

          {have.slice(0, 5).map((ing, i) => (
            <Text
              key={`have-${i}`}
              position={[-0.5, 0.12 - i * 0.07, 0.03]}
              fontSize={0.032}
              color="#4ade80"
              anchorX="left"
              maxWidth={0.9}
            >
              ✓ {ing.toUpperCase()}
            </Text>
          ))}

          {/* MISSING */}
          <Text
            position={[0.1, 0.18, 0.03]}
            fontSize={0.03}
            color="#f87171"
            anchorX="left"
          >
            MISSING
          </Text>

          {missing.length === 0 && (
            <Text
              position={[0.1, 0.12, 0.03]}
              fontSize={0.03}
              color="#4ade80"
              anchorX="left"
            >
              None 🎉
            </Text>
          )}

          {missing.slice(0, 5).map((ing, i) => (
            <Text
              key={`missing-${i}`}
              position={[0.1, 0.12 - i * 0.07, 0.03]}
              fontSize={0.032}
              color="#f87171"
              anchorX="left"
              maxWidth={0.9}
            >
              ✕ {ing.toUpperCase()}
            </Text>
          ))}

          <Text
            position={[0, -0.38, 0.03]}
            fontSize={0.036}
            maxWidth={1}
            anchorX="center"
            color="white"
          >
            Say “Start Cooking” to begin
          </Text>
        </group>
      </group>
    </group>
  );
}
