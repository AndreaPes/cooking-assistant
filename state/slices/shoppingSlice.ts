import { StateCreator } from "zustand";

/**
 * Represents a single item in the shopping list.
 */
export interface ShoppingItem {
  /** Unique identifier for the item. */
  id: string;
  /** Name or description of the item (e.g., "Milk"). */
  label: string;
  /** Quantity of the item needed. */
  quantity: number | null;
}

/**
 * Interface definition for the Shopping List Slice.
 * Manages the synchronization between the local UI state and the backend database.
 */
export interface ShoppingSlice {
  /** The current list of shopping items. */
  items: ShoppingItem[];

  /**
   * Adds an item to the shopping list.
   * Sends a POST request to the API and refreshes the local list.
   *
   * @param label - The name of the item to add.
   * @param quantity - The quantity (default is 1).
   */
  addItem: (label: string, quantity?: number | null) => Promise<void>;

  /**
   * Removes an item from the shopping list.
   * Sends a DELETE request using the item label as a keyword and refreshes the list.
   *
   * @param labelKeyword - The name of the item to remove.
   */
  removeItem: (labelKeyword: string) => Promise<void>;

  /**
   * Clears the entire shopping list.
   * Sends a DELETE request to remove all items and clears the local state.
   */
  clearAll: () => Promise<void>;

  /**
   * Fetches the latest shopping list from the server.
   * Updates the local state with the data from the database (Source of Truth).
   */
  showAll: () => Promise<void>;
}

/**
 * Slice creator for the Shopping List state.
 * Handles API interactions for CRUD operations on the shopping list.
 *
 * @param set - The Zustand set function.
 * @param get - The Zustand get function to access current state.
 */
export const createShoppingSlice: StateCreator<ShoppingSlice> = (set, get) => ({
  items: [],

  addItem: async (label, quantity = 1) => {
    try {
      await fetch("/api/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, quantity }),
      });
      // Refresh local state to reflect DB changes
      await get().showAll();
    } catch (err) {
      console.error("addItem failed", err);
    }
  },

  removeItem: async (labelKeyword) => {
    try {
      const cleanKeyword = labelKeyword.toLowerCase().trim();
      await fetch(`/api/shopping?label=${encodeURIComponent(cleanKeyword)}`, {
        method: "DELETE",
      });
      await get().showAll();
    } catch (err) {
      console.error("removeItem failed", err);
    }
  },

  clearAll: async () => {
    try {
      await fetch("/api/shopping", { method: "DELETE" });
      set({ items: [] });
    } catch (err) {
      console.error("clearAll failed", err);
    }
  },

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
