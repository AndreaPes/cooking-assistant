import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createShoppingSlice, ShoppingSlice } from "./slices/shoppingSlice";

export const useShoppingState = create<ShoppingSlice>()(
  persist(  
    (...a) => ({
      ...createShoppingSlice(...a),
      }
    ),
    {
      name: "shopping-list-storage",
    }
  )
);

// Helper to load items from server and populate the store.
export async function loadShoppingFromServer() {
  try {
    const res = await fetch('/api/shopping');
    const items = await res.json();
    useShoppingState.setState({ items });
  } catch (err) {
    console.error('Failed to load shopping items from server', err);
  }
}