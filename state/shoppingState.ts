import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createShoppingSlice, ShoppingSlice } from "./slices/shoppingSlice";

/**
 * Global Store for the Shopping List.
 * It uses the 'persist' middleware to save the state to localStorage,
 * ensuring data persists across page reloads.
 *
 * Note: Actual data synchronization with the backend is handled within the slice actions.
 */
export const useShoppingState = create<ShoppingSlice>()(
  persist(
    (...a) => ({
      ...createShoppingSlice(...a),
    }),
    {
      name: "shopping-list-storage",
    },
  ),
);

/**
 * Asynchronously fetches the latest shopping list from the server API
 * and updates the global Zustand store.
 * Useful for initial data hydration.
 */
export async function loadShoppingFromServer() {
  try {
    const res = await fetch("/api/shopping");
    const items = await res.json();
    useShoppingState.setState({ items });
  } catch (err) {
    console.error("Failed to load shopping items from server", err);
  }
}
