import { StateCreator } from "zustand";

export interface ShoppingItem {
  id: string;
  label: string;
  quantity: number | null;
}

export interface NewItemInput {
  name: string;
  quantity?: number;
  [key: string]: any;
}

export interface ShoppingSlice {
        items: ShoppingItem[];
        addItem: (label: string, quantity?: number | null) => Promise<void>;
        addItems: (itemsList: NewItemInput[]) => Promise<void>;
        removeItem: (labelKeyword: string) => Promise<boolean>;
        clearAll: () => Promise<void>;
        showAll: () => Promise<void>;
}

// Factory that creates the shopping slice for a zustand store.
// It returns the initial state and the action implementations.
export const createShoppingSlice: StateCreator<ShoppingSlice> = (set, get) => ({
    // Current list of shopping items (initially empty).
    items: [],

    // Add a new item with the provided label and optional quantity.
    // Generates a short random id for the item and appends it to the items array.
    // If an item with the same label exists in the backend, increment its quantity instead.
    addItem: async (label, quantity = 1) => {
      const q = quantity ?? 1;
      const cleanLabel = label.toLowerCase().trim();

      try {
        // Try to find an existing item in the backend (API should support query by label).
        const searchRes = await fetch(`/api/shopping?label=${encodeURIComponent(label)}`);

        if (searchRes.ok) {   
          const data = await searchRes.json();
          // API may return a single item or an array; normalize to find a matching label.
          const existing = Array.isArray(data)
            ? data.find((it: ShoppingItem) => it.label.toLowerCase().trim() === cleanLabel)
            : data && data.label && data.label.toLowerCase().trim() === cleanLabel ? data : null;

          if (existing) {
            // Update quantity in backend by adding the new quantity.
            const newQuantity = (existing.quantity ?? 0) + q;
            await fetch(`/api/shopping?id=${encodeURIComponent(existing.id)}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ quantity: newQuantity }),
            });
            return;
          }
        } else if (searchRes.status !== 404) {
          // errore diverso da "non trovato"
          console.error("searchRes failed", searchRes.status);
        }

        // No existing item found in backend: create a new one.
        await fetch('/api/shopping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label, quantity: q }),
        });

      } catch (err) {
        console.error('addItem failed', err);
      }
    },

    // Batch add multiple items to the backend.
    addItems: async (itemsList) => {
      try {
        // Retrieve the 'addItem' action from the current store state using get().
        // We cannot use 'this' here because arrow functions do not bind 'this'.
        const { addItem } = get();

        // Create an array of promises (async operations).
        // Use .map to transform each item in the list into an addItem operation.
        const promises = itemsList.map((item) => {
          
          // IMPORTANT MAPPING:
          // We extract "name" from the input list and pass it as "label" to addItem.
          // We call the function retrieved via get().
          return addItem(item.name, item.quantity); 
        });

        // Execute all calls in parallel and wait for them to finish.
        await Promise.all(promises);
        
        console.log("List processing completed.");
        
      } catch (err) {
        console.error("Error processing list", err);
      }
    },

    // Remove items that match the given label keyword.
    // Matching is case-insensitive and trims whitespace.
    // An item is removed if:
    //   - its label equals the keyword, OR
    //   - its label includes the keyword, OR
    //   - the keyword includes the label (to allow short/partial matches).
    // Returns true if at least one item was removed, false otherwise.
    removeItem: async (labelKeyword) => {
      const cleanKeyword = labelKeyword.toLowerCase().trim();

      try {
        // chiama SOLO l’API, niente ricerca negli items
        const res = await fetch(
          `/api/shopping?label=${encodeURIComponent(cleanKeyword)}`,
          { method: "DELETE" }
        );

        if (!res.ok) {
          console.error("removeItem failed with status", res.status);
          return false;
        }

        const data = await res.json(); // { ok: true, deletedCount: number }

        // se il DB dice che non ha cancellato niente, ritorni false
        if (!data.deletedCount || data.deletedCount === 0) {
          return false;
        }

        return true;
      } catch (err) {
        console.error("removeItem failed", err);
        return false;
      }
    },


    // Clear the entire shopping list.
    clearAll: async () => {
        try {
            await fetch('/api/shopping', { method: 'DELETE' });
        } catch (err) {
            console.error('clearAll failed', err);
        }
    },

    
    // Load all items from the backend and populate the local state.
    showAll: async () => {
      try {
        const res = await fetch('/api/shopping');
        if (!res.ok) {
          throw new Error(`showAll: server responded ${res.status}`);
        }
        const items: ShoppingItem[] = await res.json();
        set({ items });
      } catch (err) {
        console.error('showAll failed', err);
      }
    },
});
