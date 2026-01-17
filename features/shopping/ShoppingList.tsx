import { Html } from "@react-three/drei";
import { useState, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Quaternion, Vector3 } from "three";
import {
  useShoppingState,
  loadShoppingFromServer,
} from "@/state/shoppingState";

interface ShoppingItemProps {
  label: string;
  quantity?: number;
}

const ITEMS_PER_PAGE = 5;

export function ShoppingList({ label }: ShoppingItemProps) {
  const { items } = useShoppingState();
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // ---------------------------------------------------------------------------
  // XR CAMERA LOCK
  // ---------------------------------------------------------------------------
  const rootRef = useRef<Group>(null);

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

  // ---------------------------------------------------------------------------
  // FLASH EFFECT LOGIC (UNCHANGED)
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // INITIAL LOAD (UNCHANGED)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    loadShoppingFromServer();
  }, []);

  // ---------------------------------------------------------------------------
  // NEW ITEM DETECTION (UNCHANGED)
  // ---------------------------------------------------------------------------
  const prevFirstId = useRef<string | null>(null);

  useEffect(() => {
    if (!items || items.length === 0) {
      prevFirstId.current = null;
      return;
    }

    const first = items[0];

    if (prevFirstId.current && prevFirstId.current !== first.id) {
      setLastAdded(
        `${first.label}${first.quantity ? ` × ${first.quantity}` : ""}`
      );
      setCurrentPage(0);
    }

    prevFirstId.current = first.id;
  }, [items]);

  // ---------------------------------------------------------------------------
  // PAGINATION (UNCHANGED)
  // ---------------------------------------------------------------------------
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const visibleItems = items.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const nextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
  const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 0));

  return (
    <group ref={rootRef} frustumCulled={false} renderOrder={950}>
      {/* Camera-local offset: RIGHT SIDE */}
      <group position={[0.55, 0, -1.2]} renderOrder={950}>
        <Html transform occlude scale={0.4}>
          <div
            className={`
              w-[320px] p-6 rounded-[2rem] flex flex-col border transition-all duration-500
              ${
                lastAdded
                  ? "bg-gray-900/90 border-orange-500/50 shadow-[0_0_40px_rgba(249,115,22,0.3)]"
                  : "bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-xl"
              }
            `}
          >
            {/* HEADER */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
              <h2 className="text-xl font-black text-orange-500 uppercase tracking-tight">
                {lastAdded ? "ITEM ADDED" : label || "SHOPPING"}
              </h2>

              <div className="text-right">
                <div className="text-2xl font-mono font-bold text-white/20 leading-none">
                  {items.length.toString().padStart(2, "0")}
                </div>
                <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1">
                  TOTAL
                </div>
              </div>
            </div>

            {/* LIST */}
            <div className="min-h-[280px] flex flex-col gap-2">
              {items.length === 0 ? (
                <div className="h-full flex items-center justify-center text-white/30 text-sm italic font-medium">
                  Your list is empty
                </div>
              ) : (
                visibleItems.map((item, index) => {
                  const absoluteIndex =
                    index + 1 + currentPage * ITEMS_PER_PAGE;

                  return (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5 animate-in fade-in slide-in-from-right-4 duration-300"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-white/20 font-mono text-xs font-bold w-5">
                          {absoluteIndex}
                        </span>
                        <span className="text-white font-medium text-sm capitalize truncate">
                          {item.label}
                        </span>
                      </div>

                      {item.quantity && item.quantity > 1 && (
                        <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] font-mono text-white/70 font-bold">
                          x{item.quantity}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  className={`w-8 h-8 rounded-full border border-white/10 ${
                    currentPage === 0 ? "opacity-20" : "hover:bg-white/10"
                  }`}
                >
                  ←
                </button>

                <span className="text-[10px] font-mono font-bold text-white/40">
                  PAGE {currentPage + 1} / {totalPages}
                </span>

                <button
                  onClick={nextPage}
                  disabled={currentPage >= totalPages - 1}
                  className={`w-8 h-8 rounded-full border border-white/10 ${
                    currentPage >= totalPages - 1
                      ? "opacity-20"
                      : "hover:bg-white/10"
                  }`}
                >
                  →
                </button>
              </div>
            )}
          </div>
        </Html>
      </group>
    </group>
  );
}
