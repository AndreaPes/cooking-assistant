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

const ITEMS_PER_PAGE = 5;

export function ShoppingList({
  label,
  quantity,
  customPosition,
}: ShoppingItemProps) {
  const { items } = useShoppingState();
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0); // 👈 State per la pagina corrente

  const positionVector = customPosition || [5, 0, -2];
  const hideTimeoutRef = useRef<number | null>(null);

  // --- LOGICA FLASH "ITEM ADDED" ---
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

  // --- CARICAMENTO INIZIALE ---
  useEffect(() => {
    loadShoppingFromServer();
  }, []);

  // --- RILEVAMENTO NUOVI ITEMS ---
  const prevFirstId = useRef<string | null>(null);
  useEffect(() => {
    if (!items || items.length === 0) {
      prevFirstId.current = null;
      return;
    }
    const first = items[0];
    // Se cambia il primo elemento, significa che ne è stato aggiunto uno nuovo
    if (prevFirstId.current && prevFirstId.current !== first.id) {
      setLastAdded(
        `${first.label}${first.quantity ? ` × ${first.quantity}` : ""}`,
      );
      setCurrentPage(0); // 👈 FORZA IL RITORNO ALLA PAGINA 1 per vedere l'item
    }
    prevFirstId.current = first.id;
  }, [items]);

  // --- CALCOLI PAGINAZIONE ---
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const visibleItems = items.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE,
  );

  const nextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
  const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 0));

  return (
    <group position={positionVector}>
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
            <div>
              <h2 className="text-xl font-black text-orange-500 uppercase tracking-tight">
                {lastAdded ? "ITEM ADDED" : label || "SHOPPING"}
              </h2>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-white/20 leading-none">
                {items.length.toString().padStart(2, "0")}
              </div>
              <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1">
                TOTAL
              </div>
            </div>
          </div>

          {/* LIST CONTENT (Altezza fissa per evitare salti) */}
          <div className="min-h-[280px] flex flex-col gap-2">
            {items.length === 0 ? (
              <div className="h-full flex items-center justify-center text-white/30 text-sm italic font-medium">
                Your list is empty
              </div>
            ) : (
              visibleItems.map((item, index) => {
                const absoluteIndex = index + 1 + currentPage * ITEMS_PER_PAGE;

                return (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5 transition-colors animate-in fade-in slide-in-from-right-4 duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-white/20 font-mono text-xs font-bold w-5 flex-shrink-0">
                        {absoluteIndex}
                      </span>
                      <span className="text-white font-medium text-sm capitalize truncate">
                        {item.label}
                      </span>
                    </div>
                    {item.quantity && item.quantity > 1 && (
                      <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] font-mono text-white/70 font-bold flex-shrink-0">
                        x{item.quantity}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* FOOTER: PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
              {/* Bottone Prev */}
              <button
                onClick={prevPage}
                disabled={currentPage === 0}
                className={`w-8 h-8 flex items-center justify-center rounded-full border border-white/10 transition-all
                  ${currentPage === 0 ? "opacity-20 cursor-not-allowed" : "hover:bg-white/10 active:scale-90 text-white"}`}
              >
                ←
              </button>

              {/* Indicatore Pagina */}
              <span className="text-[10px] font-mono font-bold text-white/40 tracking-widest">
                PAGE {currentPage + 1} / {totalPages}
              </span>

              {/* Bottone Next */}
              <button
                onClick={nextPage}
                disabled={currentPage >= totalPages - 1}
                className={`w-8 h-8 flex items-center justify-center rounded-full border border-white/10 transition-all
                  ${currentPage >= totalPages - 1 ? "opacity-20 cursor-not-allowed" : "hover:bg-white/10 active:scale-90 text-white"}`}
              >
                →
              </button>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}
