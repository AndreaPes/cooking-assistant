import { StateCreator } from "zustand";

export interface ShoppingItem {
  id: string;
  label: string;
  quantity: number | null;
}

export interface ShoppingSlice {
  items: ShoppingItem[];
  addItem: (label: string, quantity?: number | null) => Promise<void>;
  removeItem: (labelKeyword: string) => Promise<void>;
  clearAll: () => Promise<void>;
  showAll: () => Promise<void>;
}

export const createShoppingSlice: StateCreator<ShoppingSlice> = (set, get) => ({
  items: [],

  // 1. Add Semplificato: Chiama POST e poi ricarica la lista
  addItem: async (label, quantity = 1) => {
    try {
      await fetch("/api/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, quantity }),
      });
      // Importante: Ricarica lo stato locale per aggiornare la UI!
      await get().showAll();
    } catch (err) {
      console.error("addItem failed", err);
    }
  },

  // 2. Remove: Chiama DELETE e poi ricarica
  removeItem: async (labelKeyword) => {
    try {
      const cleanKeyword = labelKeyword.toLowerCase().trim();
      await fetch(`/api/shopping?label=${encodeURIComponent(cleanKeyword)}`, {
        method: "DELETE",
      });
      await get().showAll(); // Aggiorna UI
    } catch (err) {
      console.error("removeItem failed", err);
    }
  },

  // 3. Clear: Chiama DELETE e svuota array locale
  clearAll: async () => {
    try {
      await fetch("/api/shopping", { method: "DELETE" });
      set({ items: [] }); // UI update immediato
    } catch (err) {
      console.error("clearAll failed", err);
    }
  },

  // 4. Show: Carica dal server (Source of Truth)
  showAll: async () => {
    try {
      const res = await fetch("/api/shopping");
      if (res.ok) {
        const items = await res.json();
        set({ items });
      }
    } catch (err) {
      console.error("showAll failed", err);
    }
  },
});
