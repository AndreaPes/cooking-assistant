import { Html } from "@react-three/drei";
import React from "react";

interface FridgeInventoryProps {
  /**
   * The list of ingredients currently stored in the state.
   * Renders as a scrollable list if items exceed the container height.
   */
  items: { name: string; quantity: number }[];

  /**
   * The 3D coordinates [x, y, z] where this panel should appear in the AR scene.
   * Defaults to [5, 0, -2] (Right side) if not provided.
   */
  customPosition?: [number, number, number];
}

/**
 * 3D Component that visualizes the current contents of the user's fridge.
 *
 * It uses a `drei/Html` overlay to render a stylized Tailwind CSS interface
 * within the 3D Canvas. It handles empty states and scrolling for long lists.
 *
 * @param items - Array of ingredients with names and quantities.
 * @param customPosition - Vector3 position for the panel anchor.
 */
export function FridgeInventory({
  items,
  customPosition,
}: FridgeInventoryProps) {
  const positionVector = customPosition || [5, 0, -2];

  return (
    <group position={positionVector}>
      <Html transform occlude scale={0.4}>
        <div className="w-[300px] p-6 rounded-[2rem] bg-gray-900/60 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col">
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
  );
}
