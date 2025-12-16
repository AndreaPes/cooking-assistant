import { create } from "zustand";

/**
 * Represents a single ingredient item in the fridge inventory.
 */
export interface FridgeItem {
  /** The name of the ingredient (e.g., "Tomato"). */
  name: string;
  /** The quantity available. */
  quantity: number;
}

/**
 * Interface definition for the Fridge Inventory Slice.
 * Manages the list of ingredients currently available in the user's fridge/kitchen.
 */
export interface FridgeInventorySlice {
  /** The current list of items in the fridge. */
  fridgeItems: FridgeItem[];

  /**
   * Overwrites the entire inventory list.
   * @param items - The new array of fridge items.
   */
  setFridgeInventory: (items: FridgeItem[]) => void;

  /**
   * Adds items to the inventory.
   * If an item with the same name exists (case-insensitive), its quantity is incremented.
   * Otherwise, the new item is appended to the list.
   *
   * @param items - The list of items to add.
   */
  addFridgeItems: (items: FridgeItem[]) => void;

  /**
   * Removes items from the inventory.
   * Decrements the quantity of the specified items.
   * If the quantity reaches zero or less, the item is removed from the list.
   *
   * @param itemsToRemove - The list of items to remove or decrement.
   */
  removeFridgeItems: (itemsToRemove: FridgeItem[]) => void;

  /**
   * Clears all items from the fridge inventory.
   */
  clearFridgeInventory: () => void;
}

/**
 * Standalone Fridge Inventory Store.
 * Used independently by the Fridge UI and AI Assistant tools to manage ingredient persistence.
 */
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
          updatedList[existingIndex] = {
            ...updatedList[existingIndex],
            quantity: updatedList[existingIndex].quantity + newItem.quantity,
          };
        } else {
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

      updatedList = updatedList.filter((i) => i.quantity > 0);

      return { fridgeItems: updatedList };
    }),

  clearFridgeInventory: () => set({ fridgeItems: [] }),
}));
