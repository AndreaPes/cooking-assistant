
import { Html } from "@react-three/drei";
import { useState, useEffect, useRef } from "react";
import { useShoppingState, loadShoppingFromServer } from "../../state/shoppingState";

interface ShoppingItemProps {
  /** Display name (e.g., "Milk") */
  label: string;
  /** Quantity of the item */
  quantity?: number;
  /** 3D coordinates for positioning [x, y, z] */
  customPosition?: [number, number, number];
}

export function ShoppingList({ 
  label,
  quantity,
  customPosition,
}: ShoppingItemProps) {

  // --- State & Hooks ---

  const { items, addItem, removeItem, clearAll } = useShoppingState();
  const [newItem, setNewItem] = useState("");
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  // Default to right-side stacking if no position provided
  const positionVector = customPosition || [5, 0, -2];

  // Nascondi preview dopo 3s
  const hideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!lastAdded) return;

    // Clear any existing timeout so the timer reliably resets
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    hideTimeoutRef.current = window.setTimeout(() => {
      setLastAdded(null);
      hideTimeoutRef.current = null;
    }, 3000);

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [lastAdded]);

  // Load items from server once when component mounts
  useEffect(() => {
    loadShoppingFromServer();
  }, []);

  // Show transient preview when a new item appears (e.g. added via voice)
  const prevFirstId = useRef<string | null>(null);
  useEffect(() => {
    if (!items || items.length === 0) {
      prevFirstId.current = null;
      return;
    }
    const first = items[0];
    if (prevFirstId.current && prevFirstId.current !== first.id) {
      setLastAdded(`${first.label}${first.quantity ? ` × ${first.quantity}` : ''}`);
    }
    prevFirstId.current = first.id;
  }, [items]);


  return (
    <group position={positionVector}>
      {/* Scale 0.4 makes it look like a compact widget/smartwatch interface */}
      <Html transform occlude scale={0.4}>
        <div
          className={`w-48 p-4 rounded-2xl flex flex-col items-center select-none border backdrop-blur-md shadow-lg transition-all duration-500
            ${
              lastAdded
                ? "bg-red-500/40 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.6)] animate-pulse"
                : "bg-white/10 border-white/20 shadow-sm"
            }
          `}
        >
          <span className={`uppercase tracking-wider text-[10px] font-bold mb-1 ${lastAdded ? "text-white" : "text-white/60"}`}>
            {lastAdded ? "ADDED" : label ?? "Shopping List"}
          </span>

          <div className="text-2xl font-mono font-medium text-white tracking-tight drop-shadow-sm mb-2">
            {lastAdded ?? `${items.length} ${items.length === 1 ? "element" : "elements"}`}
          </div>

          {/* Progress bar that fills when a new item was just added */}
          <div className="h-1 w-full bg-black/20 rounded-full mt-1 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${lastAdded ? "bg-red-500 w-full" : "bg-white/80"}`}
              style={{ width: lastAdded ? "100%" : "0%" }}
            />
          </div>

          <ul className="w-full mt-3 mb-2">
            {items.length === 0 ? (
              <li className="text-white/40 italic text-center">No elements</li>
            ) : (
              items.map((item, index) => (
                <li key={item.id} className="flex justify-between items-center py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-sm w-5 text-right">{index + 1}.</span>
                        <span className="text-white">
                          {item.label}
                          {item.quantity != null && (
                            <span className="text-sm text-white/60 ml-2">× {item.quantity}</span>
                          )}
                        </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </Html>
    </group>
  );
}