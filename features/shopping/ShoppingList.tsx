import { useState, useEffect, useRef } from "react";
import { RoundedBox, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, Quaternion, Vector3, Mesh } from "three";
import {
  useShoppingState,
  loadShoppingFromServer,
} from "@/state/shoppingState";

interface ShoppingItemProps {
  /**
   * The display title for the shopping list panel.
   */
  label: string;
  /**
   * Optional quantity identifier (unused in current render logic).
   */
  quantity?: number;
}

const ITEMS_PER_PAGE = 5;

/**
 * A 3D interactive shopping list HUD component.
 *
 * Features:
 * - XR Head-locking: Floats in the user's view (typically positioned to the side).
 * - Visual Feedback: The panel border flashes orange when a new item is added.
 * - Pagination: Supports navigation through large lists of ingredients.
 * - Auto-Refresh: Automatically updates when the global shopping state changes.
 */
export function ShoppingList({ label }: ShoppingItemProps) {
  const { items } = useShoppingState();
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const rootRef = useRef<Group>(null);
  const borderRef = useRef<Mesh>(null);

  const tmpPos = useRef(new Vector3()).current;
  const tmpQuat = useRef(new Quaternion()).current;

  useFrame((state) => {
    if (rootRef.current) {
      const camAny: any = state.camera;
      const cam = camAny.isArrayCamera ? camAny.cameras[0] : camAny;

      cam.getWorldPosition(tmpPos);
      cam.getWorldQuaternion(tmpQuat);

      rootRef.current.position.copy(tmpPos);
      rootRef.current.quaternion.copy(tmpQuat);
      rootRef.current.frustumCulled = false;
    }

    if (borderRef.current) {
      if (lastAdded) {
        const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 15) * 0.5;
        (borderRef.current.material as any).color.setHSL(
          0.08,
          1,
          0.3 + pulse * 0.2,
        );
        (borderRef.current.material as any).opacity = 0.8;
      } else {
        (borderRef.current.material as any).color.setHex(0xffffff);
        (borderRef.current.material as any).opacity = 0.1;
      }
    }
  });

  const hideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!lastAdded) return;
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

    hideTimeoutRef.current = window.setTimeout(() => {
      setLastAdded(null);
      hideTimeoutRef.current = null;
    }, 3000);

    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [lastAdded]);

  useEffect(() => {
    loadShoppingFromServer();
  }, []);

  const prevFirstId = useRef<string | null>(null);

  useEffect(() => {
    if (!items || items.length === 0) {
      prevFirstId.current = null;
      return;
    }
    const first = items[0];
    if (prevFirstId.current && prevFirstId.current !== first.id) {
      setLastAdded(
        `${first.label}${first.quantity ? ` × ${first.quantity}` : ""}`,
      );
      setCurrentPage(0);
    }
    prevFirstId.current = first.id;
  }, [items]);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const visibleItems = items.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE,
  );

  const nextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
  const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 0));

  return (
    <group ref={rootRef} frustumCulled={false} renderOrder={950}>
      <group position={[0, 0, -1]} scale={0.55}>
        <group>
          <RoundedBox ref={borderRef} args={[0.62, 0.82, 0.01]} radius={0.06}>
            <meshBasicMaterial color="white" transparent={true} opacity={0.1} />
          </RoundedBox>

          <RoundedBox args={[0.6, 0.8, 0.02]} radius={0.05} smoothness={4}>
            <meshStandardMaterial
              color="#0f172a"
              transparent={true}
              opacity={0.92}
              roughness={0.2}
            />
          </RoundedBox>
        </group>

        <group position={[0, 0.32, 0.03]}>
          <Text
            fontSize={0.045}
            color={lastAdded ? "#f97316" : "#ffffff"}
            anchorX="center"
            maxWidth={0.5}
          >
            {lastAdded ? "ITEM ADDED!" : label || "SHOPPING LIST"}
          </Text>

          <Text
            position={[0.22, 0, 0]}
            fontSize={0.025}
            color="#9ca3af"
            anchorX="right"
          >
            {items.length}
          </Text>
        </group>

        <mesh position={[0, 0.28, 0.03]}>
          <planeGeometry args={[0.5, 0.003]} />
          <meshBasicMaterial color="white" opacity={0.2} transparent={true} />
        </mesh>

        <group position={[0, 0.2, 0.03]}>
          {items.length === 0 ? (
            <Text position={[0, -0.2, 0]} fontSize={0.03} color="#64748b">
              Your list is empty
            </Text>
          ) : (
            visibleItems.map((item, index) => {
              const rowY = -index * 0.11;
              const absoluteIndex = index + 1 + currentPage * ITEMS_PER_PAGE;

              return (
                <group key={item.id} position={[0, rowY, 0]}>
                  <RoundedBox args={[0.52, 0.09, 0.005]} radius={0.02}>
                    <meshBasicMaterial
                      color="white"
                      transparent={true}
                      opacity={index % 2 === 0 ? 0.05 : 0.02}
                    />
                  </RoundedBox>

                  <Text
                    position={[-0.23, 0, 0.01]}
                    fontSize={0.025}
                    color="#64748b"
                    anchorX="left"
                    anchorY="middle"
                  >
                    {absoluteIndex}.
                  </Text>

                  <Text
                    position={[-0.18, 0, 0.01]}
                    fontSize={0.035}
                    color="white"
                    anchorX="left"
                    anchorY="middle"
                    maxWidth={0.3}
                  >
                    {item.label.charAt(0).toUpperCase() +
                      item.label.slice(1)}{" "}
                  </Text>

                  {item.quantity && item.quantity > 1 && (
                    <group position={[0.2, 0, 0.01]}>
                      <RoundedBox args={[0.08, 0.05, 0.005]} radius={0.01}>
                        <meshBasicMaterial
                          color="#ffffff"
                          transparent={true}
                          opacity={0.15}
                        />
                      </RoundedBox>
                      <Text
                        fontSize={0.025}
                        color="#e2e8f0"
                        anchorX="center"
                        anchorY="middle"
                      >
                        x{item.quantity}
                      </Text>
                    </group>
                  )}
                </group>
              );
            })
          )}
        </group>

        {totalPages > 1 && (
          <group position={[0, -0.32, 0.04]}>
            <group position={[-0.15, 0, 0]}>
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  prevPage();
                }}
                visible={currentPage > 0}
              >
                <planeGeometry args={[0.1, 0.1]} />
                <meshBasicMaterial visible={false} />
              </mesh>
              <Text
                fontSize={0.05}
                color={currentPage > 0 ? "white" : "#4b5563"}
                onClick={(e) => {
                  e.stopPropagation();
                  prevPage();
                }}
              >
                ←
              </Text>
            </group>

            <Text fontSize={0.025} color="#94a3b8" letterSpacing={0.05}>
              PAGE {currentPage + 1} / {totalPages}
            </Text>

            <group position={[0.15, 0, 0]}>
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  nextPage();
                }}
                visible={currentPage < totalPages - 1}
              >
                <planeGeometry args={[0.1, 0.1]} />
                <meshBasicMaterial visible={false} />
              </mesh>
              <Text
                fontSize={0.05}
                color={currentPage < totalPages - 1 ? "white" : "#4b5563"}
                onClick={(e) => {
                  e.stopPropagation();
                  nextPage();
                }}
              >
                →
              </Text>
            </group>
          </group>
        )}
      </group>
    </group>
  );
}
