import { StateCreator, create } from "zustand";

export interface FridgeItem {
  name: string;
  quantity: number;
}

export interface FridgeInventorySlice {
  /** Current list of ingredients detected in the fridge */
  fridgeItems: FridgeItem[];

  /** Replace the entire fridge inventory (e.g., after a new AR scan) */
  setFridgeInventory: (items: FridgeItem[]) => void;

  /** Clear the entire fridge inventory */
  clearFridgeInventory: () => void;
}

export const createFridgeInventorySlice: StateCreator<FridgeInventorySlice> = (set) => ({
  /** Initial state: empty fridge */
  fridgeItems: [],

  /** Overwrite the current inventory with a new list of items */
  setFridgeInventory: (items) =>
    set({
      fridgeItems: items,
    }),

  /** Clear all items from the fridge inventory */
  clearFridgeInventory: () =>
    set({
      fridgeItems: [],
    }),
});

// Hook Zustand
export const useFridgeInventoryState = create<FridgeInventorySlice>((set) => ({
  fridgeItems: [],
  setFridgeInventory: (items) => set({ fridgeItems: items }),
  clearFridgeInventory: () => set({ fridgeItems: [] }),
}));
