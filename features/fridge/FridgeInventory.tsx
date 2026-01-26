import { useState, useRef } from "react";
import { RoundedBox, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, Quaternion, Vector3 } from "three";

interface FridgeInventoryProps {
  /**
   * The list of ingredients currently stored in the fridge.
   */
  items: { name: string; quantity: number }[];
}

const ITEMS_PER_PAGE = 5;

/**
 * A 3D HUD panel that displays the user's fridge inventory.
 *
 * Features:
 * - XR Head-locking: Follows the user's field of view.
 * - Pagination: Supports scrolling through items if they exceed the page limit.
 * - 3D Native UI: Built using R3F primitives (RoundedBox, Text) without HTML overlays.
 */
export function FridgeInventory({ items }: FridgeInventoryProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const rootRef = useRef<Group>(null);
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
  });

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
        <RoundedBox args={[0.6, 0.8, 0.02]} radius={0.05} smoothness={4}>
          <meshStandardMaterial
            color="#0f172a"
            transparent={true}
            opacity={0.92}
            roughness={0.2}
          />
        </RoundedBox>

        <group position={[0, 0.32, 0.03]}>
          <Text
            fontSize={0.025}
            color="#9ca3af"
            anchorX="center"
            position={[0, 0.04, 0]}
            letterSpacing={0.1}
          >
            INVENTORY
          </Text>
          <Text
            fontSize={0.05}
            color="#f97316"
            anchorX="center"
            fontWeight="bold"
          >
            FRIDGE
          </Text>

          <Text
            position={[0.22, 0, 0]}
            fontSize={0.025}
            color="#9ca3af"
            anchorX="right"
          >
            {items.length.toString().padStart(2, "0")}
          </Text>
        </group>

        <mesh position={[0, 0.26, 0.03]}>
          <planeGeometry args={[0.5, 0.003]} />
          <meshBasicMaterial color="white" opacity={0.2} transparent={true} />
        </mesh>

        <group position={[0, 0.18, 0.03]}>
          {items.length === 0 ? (
            <Text
              position={[0, -0.2, 0]}
              fontSize={0.03}
              color="#64748b"
              fontStyle="italic"
            >
              No items detected
            </Text>
          ) : (
            visibleItems.map((item, index) => {
              const rowY = -index * 0.11;
              const displayLabel =
                item.name.charAt(0).toUpperCase() + item.name.slice(1);

              return (
                <group key={index} position={[0, rowY, 0]}>
                  <RoundedBox args={[0.52, 0.09, 0.005]} radius={0.02}>
                    <meshBasicMaterial
                      color="white"
                      transparent={true}
                      opacity={index % 2 === 0 ? 0.05 : 0.02}
                    />
                  </RoundedBox>

                  <Text
                    position={[-0.23, 0, 0.01]}
                    fontSize={0.035}
                    color="white"
                    anchorX="left"
                    anchorY="middle"
                    maxWidth={0.35}
                  >
                    {displayLabel}
                  </Text>

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
                      {item.quantity}
                    </Text>
                  </group>
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
