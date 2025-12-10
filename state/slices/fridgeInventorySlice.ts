import { create } from "zustand";

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

/**
 * Standalone Fridge Inventory Store
 * ---------------------------------
 * Manages the list of ingredients currently available in the user's fridge/kitchen.
 * This store is used independently by the Fridge UI and the AI Assistant tools.
 */
export const useFridgeInventoryState = create<FridgeInventorySlice>((set) => ({
  fridgeItems: [],

  /**
   * Overwrites the entire inventory list.
   */
  setFridgeInventory: (items) => set({ fridgeItems: items }),

  /**
   * Adds items to the inventory.
   * Logic:
   * - Checks if an item with the same name (case-insensitive) already exists.
   * - If yes, it increments the quantity.
   * - If no, it appends the new item to the list.
   */
  addFridgeItems: (newItems) =>
    set((state) => {
      const updatedList = [...state.fridgeItems];

      newItems.forEach((newItem) => {
        const existingIndex = updatedList.findIndex(
          (existing) =>
            existing.name.toLowerCase() === newItem.name.toLowerCase(),
        );

        if (existingIndex >= 0) {
          // Item exists: Update quantity immutably
          updatedList[existingIndex] = {
            ...updatedList[existingIndex],
            quantity: updatedList[existingIndex].quantity + newItem.quantity,
          };
        } else {
          // New Item: Add to list
          updatedList.push(newItem);
        }
      });

      return { fridgeItems: updatedList };
    }),

  /**
   * Removes items from the inventory.
   * Logic:
   * - Decrements the quantity of the specified items.
   * - If the quantity reaches 0 or less, the item is removed from the array.
   */
  removeFridgeItems: (itemsToRemove) =>
    set((state) => {
      let updatedList = [...state.fridgeItems];

      itemsToRemove.forEach((toRemove) => {
        const index = updatedList.findIndex(
          (i) => i.name.toLowerCase() === toRemove.name.toLowerCase(),
        );

        if (index >= 0) {
          const currentQty = updatedList[index].quantity;
          // Decrement quantity immutably
          updatedList[index] = {
            ...updatedList[index],
            quantity: currentQty - toRemove.quantity,
          };
        }
      });

      // CLEANUP: Filter out items that have 0 or negative quantity
      updatedList = updatedList.filter((i) => i.quantity > 0);

      return { fridgeItems: updatedList };
    }),

  /**
   * Clears the entire inventory.
   */
  clearFridgeInventory: () => set({ fridgeItems: [] }),
}));
