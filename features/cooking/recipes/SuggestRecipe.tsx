import { useRef, useState, useEffect } from "react";
import { RoundedBox, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, Quaternion, Vector3 } from "three";
import { useCookingState } from "@/state/cookingState";
import { useShoppingState } from "@/state/shoppingState";
import type { RecipeSuggestionData } from "@/types/interfaces";

interface SuggestRecipeProps {
  data: RecipeSuggestionData | null;
}

export function SuggestRecipe({ data }: SuggestRecipeProps) {
  const rootRef = useRef<Group>(null);
  const panelRef = useRef<Group>(null);

  // temp objects (NO allocations)
  const tmpPos = useRef(new Vector3()).current;
  const tmpQuat = useRef(new Quaternion()).current;

  const { setSuggestion, setSelectedSuggestionIndex } = useCookingState();
  const { items: shoppingItems } = useShoppingState();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // --------------------------------------------------
  // SYNC LOGIC (UNCHANGED)
  // --------------------------------------------------

  useEffect(() => {
    if (!data || !data.recipes?.length) {
      setSuggestion(null);
      setSelectedSuggestionIndex(null);
    } else {
      setSuggestion(data);
    }
  }, [data, setSuggestion, setSelectedSuggestionIndex]);

  useEffect(() => {
    if (!data?.recipes?.length) {
      setSelectedIndex(null);
      setSelectedSuggestionIndex(null);
      return;
    }

    if (data.selectedTitle) {
      const target = data.selectedTitle.toLowerCase();
      const idx = data.recipes.findIndex((r) =>
        r.title?.toLowerCase().includes(target)
      );
      if (idx >= 0) {
        setSelectedIndex(idx);
        setSelectedSuggestionIndex(idx);
        return;
      }
    }

    setSelectedIndex(null);
    setSelectedSuggestionIndex(null);
  }, [data, setSelectedSuggestionIndex]);

  // --------------------------------------------------
  // XR HEAD-LOCK (HOOK MUST ALWAYS RUN)
  // --------------------------------------------------

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

  // --------------------------------------------------
  // GUARD (AFTER HOOKS)
  // --------------------------------------------------

  if (!data || !data.recipes?.length) return null;

  const recipes = data.recipes;

  // ==================================================
  // OVERVIEW MODE
  // ==================================================

  if (selectedIndex === null) {
    return (
      <group ref={rootRef} frustumCulled={false} renderOrder={997}>
        <group position={[0, -0.05, -1]}>
          <group ref={panelRef}>
            <RoundedBox args={[0.9, 0.6, 0.04]} radius={0.08}>
              <meshStandardMaterial
                color="#111827"
                transparent
                opacity={0.92}
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

            {recipes.slice(0, 4).map((r, i) => (
              <Text
                key={i}
                position={[0, 0.14 - i * 0.09, 0.03]}
                fontSize={0.038}
                maxWidth={0.75}
                anchorX="center"
              >
                {`${i + 1}. ${r.title}`}
              </Text>
            ))}
          </group>
        </group>
      </group>
    );
  }

  // ==================================================
  // DETAIL MODE
  // ==================================================

  const recipe = recipes[Math.min(selectedIndex, recipes.length - 1)];

  return (
    <group ref={rootRef} frustumCulled={false} renderOrder={997}>
      <group position={[0, -0.05, -1]}>
        <group ref={panelRef}>
          <RoundedBox args={[1.1, 0.7, 0.04]} radius={0.08}>
            <meshStandardMaterial
              color="#111827"
              transparent
              opacity={0.94}
              depthTest={false}
              depthWrite={false}
            />
          </RoundedBox>

          <Text
            position={[0, 0.28, 0.03]}
            fontSize={0.05}
            color="#fb923c"
            maxWidth={0.95}
            anchorX="center"
          >
            {recipe.title}
          </Text>

          <Text
            position={[0, 0.15, 0.03]}
            fontSize={0.035}
            color="white"
            anchorX="center"
          >
            {`⏱ ${recipe.estimatedTimeMinutes || "--"} min   ⚡ ${
              recipe.difficulty || "MED"
            }`}
          </Text>

          <Text
            position={[0, -0.05, 0.03]}
            fontSize={0.038}
            maxWidth={0.95}
            anchorX="center"
          >
            Say “Start Cooking” to begin
          </Text>
        </group>
      </group>
    </group>
  );
}
