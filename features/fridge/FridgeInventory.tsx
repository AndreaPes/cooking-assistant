import { Html } from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Quaternion, Vector3 } from "three";

interface FridgeInventoryProps {
  /**
   * The list of ingredients currently stored in the state.
   * Renders as a scrollable list if items exceed the container height.
   */
  items: { name: string; quantity: number }[];
}

/**
 * Head-locked HUD panel that visualizes the current contents of the user's fridge.
 * Conforms to the XR UI standard used by StepGuide / ShoppingList / InfoPanel.
 */
export function FridgeInventory({ items }: FridgeInventoryProps) {
  // ---------------------------------------------------------------------------
  // XR CAMERA LOCK
  // ---------------------------------------------------------------------------
  const rootRef = useRef<Group>(null);

  // temp objects (NO allocations)
  const tmpPos = useRef(new Vector3()).current;
  const tmpQuat = useRef(new Quaternion()).current;

  useFrame((state) => {
    const camAny: any = state.camera;
    const cam = camAny.isArrayCamera ? camAny.cameras[0] : camAny;

    if (!rootRef.current) return;

    cam.getWorldPosition(tmpPos);
    cam.getWorldQuaternion(tmpQuat);

    rootRef.current.position.copy(tmpPos);
    rootRef.current.quaternion.copy(tmpQuat);
    rootRef.current.frustumCulled = false;
  });

  return (
    <group ref={rootRef} frustumCulled={false} renderOrder={950}>
      {/* Camera-local offset: RIGHT SIDE */}
      <group position={[0.55, 0, -1.2]} renderOrder={950}>
        <Html transform occlude scale={0.4}>
          <div className="w-[300px] p-6 rounded-[2rem] bg-gray-900/60 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] text-white/40 font-bold tracking-[0.2em] uppercase block mb-1">
                  INVENTORY
                </span>
                <h2 className="text-xl font-black text-orange-500 uppercase tracking-tight">
                  FRIDGE
                </h2>
              </div>

              <div className="text-2xl font-mono font-bold text-white/20">
                {items.length.toString().padStart(2, "0")}
              </div>
            </div>

            {/* CONTENT */}
            {items.length === 0 ? (
              <div className="py-8 text-center text-white/30 text-sm italic font-medium">
                No items detected
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <span className="text-white font-medium text-sm capitalize">
                      {item.name}
                    </span>

                    <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] font-mono text-white/70 font-bold min-w-[30px] text-center">
                      {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Html>
      </group>
    </group>
  );
}
