import { Html } from "@react-three/drei";
import React from "react";

interface FridgeInventoryProps {
  /** Array of detected ingredients */
  items: { name: string; quantity: number }[];

  /** 3D coordinates for panel placement */
  customPosition?: [number, number, number];
}

export function FridgeInventory({
  items,
  customPosition,
}: FridgeInventoryProps) {
  // Default to right-side placement like the Timer
  const positionVector = customPosition || [5, 0, -2];

  return (
    <group position={positionVector}>
      <Html transform occlude scale={0.4}>
        <div
          className="
            w-64 p-4 rounded-2xl select-none backdrop-blur-md 
            bg-white/10 border border-white/20 shadow-lg
            text-white flex flex-col gap-3
          "
        >
          {/* Title */}
          <div className="text-center">
            <span className="uppercase text-[11px] tracking-wider font-bold text-white/70">
              Fridge Inventory
            </span>
          </div>

          {/* If empty */}
          {items.length === 0 && (
            <div className="text-center text-white/60 text-sm">EMPTY</div>
          )}

          {/* Ingredient List */}
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="
                  flex justify-between items-center
                  bg-black/20 border border-white/10 rounded-xl
                  px-3 py-2 shadow-sm
                "
              >
                <span className="text-sm font-medium">{item.name}</span>

                <span
                  className="
                    bg-white/20 text-white text-xs font-bold
                    px-2 py-1 rounded-full min-w-[28px] text-center
                  "
                >
                  {item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Html>
    </group>
  );
}
