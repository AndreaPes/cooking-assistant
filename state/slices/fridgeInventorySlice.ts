import { StateCreator, create } from "zustand";

export interface FridgeItem {
  name: string;
  quantity: number;
}

export interface FridgeInventorySlice {
  fridgeItems: FridgeItem[];
  setFridgeInventory: (items: FridgeItem[]) => void;
  addFridgeItems: (items: FridgeItem[]) => void;
  removeFridgeItems: (itemsToRemove: FridgeItem[]) => void;
  clearFridgeInventory: () => void;
}

export const createFridgeInventorySlice: StateCreator<FridgeInventorySlice> = (
  set,
) => ({
  fridgeItems: [],

  setFridgeInventory: (items) => set({ fridgeItems: items }),

  addFridgeItems: (newItems) =>
    set((state) => {
      const updatedList = [...state.fridgeItems];

      newItems.forEach((newItem) => {
        const existingIndex = updatedList.findIndex(
          (existing) =>
            existing.name.toLowerCase() === newItem.name.toLowerCase(),
        );

        if (existingIndex >= 0) {
          // If exists, just increment quantity
          updatedList[existingIndex] = {
            ...updatedList[existingIndex],
            quantity: updatedList[existingIndex].quantity + newItem.quantity,
          };
        } else {
          // If new, push to list
          updatedList.push(newItem);
        }
      });

      return { fridgeItems: updatedList };
    }),

  removeFridgeItems: (itemsToRemove) =>
    set((state) => {
      let updatedList = [...state.fridgeItems];

      itemsToRemove.forEach((toRemove) => {
        const index = updatedList.findIndex(
          (i) => i.name.toLowerCase() === toRemove.name.toLowerCase(),
        );

        if (index >= 0) {
          const currentQty = updatedList[index].quantity;
          updatedList[index] = {
            ...updatedList[index],
            quantity: currentQty - toRemove.quantity,
          };
        }
      });

      // Cleanup: Remove items with 0 or negative quantity
      updatedList = updatedList.filter((i) => i.quantity > 0);

      return { fridgeItems: updatedList };
    }),

  clearFridgeInventory: () => set({ fridgeItems: [] }),
});

export const useFridgeInventoryState = create<FridgeInventorySlice>((set) => ({
  fridgeItems: [],
  setFridgeInventory: (items) => set({ fridgeItems: items }),
  addFridgeItems: (newItems) =>
    set((state) => {
      const updatedList = [...state.fridgeItems];
      newItems.forEach((newItem) => {
        const existingIndex = updatedList.findIndex(
          (existing) =>
            existing.name.toLowerCase() === newItem.name.toLowerCase(),
        );
        if (existingIndex >= 0) {
          updatedList[existingIndex].quantity += newItem.quantity;
        } else {
          updatedList.push(newItem);
        }
      });
      return { fridgeItems: updatedList };
    }),
  removeFridgeItems: (items) => console.log("Removed ", items),
  clearFridgeInventory: () => set({ fridgeItems: [] }),
}));
