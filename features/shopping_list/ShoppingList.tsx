import { Html } from "@react-three/drei";
import { useState, useEffect, useRef } from "react";
import {
  useShoppingState,
  loadShoppingFromServer,
} from "@/state/shoppingState";

interface ShoppingItemProps {
  label: string;
  quantity?: number;
  customPosition?: [number, number, number];
}

export function ShoppingList({
  label,
  quantity,
  customPosition,
}: ShoppingItemProps) {
  const { items } = useShoppingState();
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const positionVector = customPosition || [5, 0, -2];
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
    }
    prevFirstId.current = first.id;
  }, [items]);

  return (
    <group position={positionVector}>
      <Html transform occlude scale={0.4}>
        <div
          className={`
          w-[300px] p-6 rounded-[2rem] flex flex-col border transition-all duration-500
          ${
            lastAdded
              ? "bg-gray-900/90 border-orange-500/50 shadow-[0_0_40px_rgba(249,115,22,0.3)]"
              : "bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-xl"
          }
        `}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
            <div>
              <span className="text-[10px] text-white/40 font-bold tracking-[0.2em] uppercase block mb-1">
                LIST
              </span>
              <h2 className="text-xl font-black text-orange-500 uppercase tracking-tight">
                {lastAdded ? "ITEM ADDED" : label || "SHOPPING"}
              </h2>
            </div>
            <div className="text-2xl font-mono font-bold text-white/20">
              {items.length.toString().padStart(2, "0")}
            </div>
          </div>

          {/* List Content */}
          <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {items.length === 0 ? (
              <div className="py-8 text-center text-white/30 text-sm italic font-medium">
                Your list is empty
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white/20 font-mono text-xs font-bold w-4">
                      {index + 1}
                    </span>
                    <span className="text-white font-medium text-sm capitalize">
                      {item.label}
                    </span>
                  </div>
                  {item.quantity && item.quantity > 1 && (
                    <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] font-mono text-white/70 font-bold">
                      x{item.quantity}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Html>
    </group>
  );
}
