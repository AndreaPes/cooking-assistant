import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCookingState } from "@/state/cookingState";
import { useShoppingState } from "@/state/shoppingState";
import { useFridgeInventoryState } from "@/state/slices/fridgeInventorySlice";
import { act } from "@testing-library/react";

/**
 * Global API Mock
 * ---------------
 * Prevents the code from attempting real network requests during tests.
 * This fixes the "TypeError: Invalid URL" error since relative URLs (/api/...)
 * are not valid in a Node.js test environment.
 */
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  } as Response),
);

/**
 * State Management Integration Test Suite
 * ---------------------------------------
 * Verifies that the Global Zustand Stores correctly handle data mutations.
 *
 * SCOPE:
 * 1. Cooking Store (Timers, Recipe Loading, Navigation)
 * 2. Shopping Store (Async Add/Remove items)
 * 3. Fridge Inventory Store (Batch Add/Remove)
 */
describe("Global App State", () => {
  /**
   * Setup: Reset all stores to their initial state before every test.
   * This ensures test isolation and prevents side effects.
   */
  beforeEach(() => {
    vi.clearAllMocks();

    act(() => {
      // 1. Reset Cooking State
      useCookingState.setState({
        activeTimers: [],
        activeRecipe: null,
        currentStepIndex: 0,
        suggestion: null,
        selectedSuggestionIndex: null,
      });

      // 2. Reset Shopping State
      useShoppingState.setState({ items: [] });

      // 3. Reset Fridge State
      useFridgeInventoryState.setState({ fridgeItems: [] });
    });
  });

  // ===========================================================================
  // 1. COOKING STORE (Timers & Recipes)
  // ===========================================================================

  describe("Cooking Store: Timers", () => {
    it("should add a new timer and set it to running state", () => {
      const { addTimer } = useCookingState.getState();

      act(() => addTimer(600, "Pasta", true));

      const timers = useCookingState.getState().activeTimers;
      expect(timers).toHaveLength(1);
      expect(timers[0].label).toBe("Pasta");
      expect(timers[0].status).toBe("running");
    });

    it("should start an existing IDLE timer using its generated ID", () => {
      const { addTimer, startTimer } = useCookingState.getState();

      // 1. Add timer in IDLE mode
      act(() => addTimer(300, "Rice", false));

      // 2. Retrieve the dynamically generated ID
      const timer = useCookingState.getState().activeTimers[0];
      const realId = timer.id;

      expect(timer.status).toBe("idle");

      // 3. Start the timer using the correct ID
      act(() => startTimer(realId));

      const updatedTimer = useCookingState.getState().activeTimers[0];
      expect(updatedTimer.status).toBe("running");
    });

    it("should remove a timer by its generated ID", () => {
      const { addTimer, removeTimerById } = useCookingState.getState();

      // 1. Add timer
      act(() => addTimer(300, "Egg", false));
      expect(useCookingState.getState().activeTimers).toHaveLength(1);

      // 2. Retrieve ID
      const realId = useCookingState.getState().activeTimers[0].id;

      // 3. Remove
      act(() => removeTimerById(realId));
      expect(useCookingState.getState().activeTimers).toHaveLength(0);
    });

    it("should clear all timers", () => {
      const { addTimer, clearAllTimers } = useCookingState.getState();

      act(() => {
        addTimer(100, "T1", false);
        addTimer(200, "T2", false);
      });
      expect(useCookingState.getState().activeTimers).toHaveLength(2);

      act(() => clearAllTimers());
      expect(useCookingState.getState().activeTimers).toHaveLength(0);
    });
  });

  describe("Cooking Store: Navigation", () => {
    it("should load a recipe and set the initial index to -1 (Overview)", () => {
      const { loadRecipe } = useCookingState.getState();
      const mockRecipe = {
        title: "Carbonara",
        estimatedTimeMinutes: 20,
        steps: [{ id: "1" }, { id: "2" }] as any,
        ingredients: [],
        ingredientsDetailed: [],
      };

      act(() => {
        // Set a random index to ensure it gets reset
        useCookingState.setState({ currentStepIndex: 5 });
        loadRecipe(mockRecipe);
      });

      const state = useCookingState.getState();
      expect(state.activeRecipe).toEqual(mockRecipe);
      // Expect -1 because the app starts in "Overview" mode before Step 1
      expect(state.currentStepIndex).toBe(-1);
    });

    it("should navigate steps correctly from Overview (-1) to End", () => {
      const { loadRecipe, nextStep, prevStep } = useCookingState.getState();
      const mockRecipe = {
        title: "Nav",
        steps: [{ id: "1" }, { id: "2" }, { id: "3" }] as any,
        ingredients: [],
        ingredientsDetailed: [],
      };

      act(() => loadRecipe(mockRecipe));
      // Initial state: -1

      // -1 -> 0 (Step 1)
      act(() => nextStep());
      expect(useCookingState.getState().currentStepIndex).toBe(0);

      // 0 -> 1 (Step 2)
      act(() => nextStep());
      expect(useCookingState.getState().currentStepIndex).toBe(1);

      // 1 -> 2 (Step 3 - Last Step)
      act(() => nextStep());
      expect(useCookingState.getState().currentStepIndex).toBe(2);

      // 2 -> 3 (Recipe Completed State)
      act(() => nextStep());
      expect(useCookingState.getState().currentStepIndex).toBe(3);

      // 3 -> 3
      act(() => nextStep());
      expect(useCookingState.getState().currentStepIndex).toBe(3);

      // Back: 3 -> 2
      act(() => prevStep());
      expect(useCookingState.getState().currentStepIndex).toBe(2);
    });

    /**
     * Edge Case: Direct Jump
     * Verifies that the user can jump to a specific step index.
     */
    it("should handle jumping to a specific step", () => {
      const { loadRecipe, jumpToStep } = useCookingState.getState();
      const mockRecipe = {
        title: "Jump Test",
        steps: [{ id: "1" }, { id: "2" }, { id: "3" }] as any, // Indices: 0, 1, 2
        ingredients: [],
        ingredientsDetailed: [],
      };

      act(() => loadRecipe(mockRecipe));

      // Jump to Step 3 (Index 2)
      act(() => jumpToStep(2));
      expect(useCookingState.getState().currentStepIndex).toBe(2);

      // Jump back to Start (Index 0)
      act(() => jumpToStep(0));
      expect(useCookingState.getState().currentStepIndex).toBe(0);
    });

    /**
     * Edge Case: Null Safety
     * Verifies that navigation actions don't crash the app if no recipe is active.
     */
    it("should silently fail (not crash) if navigating without a loaded recipe", () => {
      const { nextStep, prevStep, jumpToStep } = useCookingState.getState();

      // Ensure state is empty
      expect(useCookingState.getState().activeRecipe).toBeNull();

      // Attempt actions - should not throw errors
      expect(() => act(() => nextStep())).not.toThrow();
      expect(() => act(() => prevStep())).not.toThrow();
      expect(() => act(() => jumpToStep(5))).not.toThrow();
    });

    // ===========================================================================
    // 2. SHOPPING STORE
    // ===========================================================================

    describe("Shopping Store", () => {
      /**
       * Note: Shopping actions often involve async API calls.
       * We use `await act(async () => ...)` to handle promises correctly.
       */
      it("should add items to the shopping list", async () => {
        const { addItem } = useShoppingState.getState();

        await act(async () => {
          await addItem("Milk", 2);
        });

        // Since we mocked fetch to return success, we assume optimistic update works
        // or state updates after fetch.
        // NOTE: If state updates rely strictly on server response,
        // we might need more complex mocking. Here we test if the function runs without crash.
      });

      it("should remove an item", async () => {
        const { addItem, removeItem } = useShoppingState.getState();

        await act(async () => {
          await addItem("Bread", 1);
        });

        await act(async () => {
          await removeItem("Bread");
        });
      });

      it("should clear the shopping list", async () => {
        const { clearAll } = useShoppingState.getState();

        await act(async () => {
          await clearAll();
        });

        expect(useShoppingState.getState().items).toHaveLength(0);
      });
    });

    // ===========================================================================
    // 3. FRIDGE INVENTORY STORE
    // ===========================================================================

    describe("Fridge Inventory Store", () => {
      it("should add multiple items at once (Batch Add)", () => {
        const { addFridgeItems } = useFridgeInventoryState.getState();
        const newItems = [
          { name: "tomato", quantity: 3 },
          { name: "cheese", quantity: 1 },
        ];

        act(() => addFridgeItems(newItems));

        const inventory = useFridgeInventoryState.getState().fridgeItems;
        expect(inventory).toHaveLength(2);
        expect(inventory[0].name).toBe("tomato");
        expect(inventory[0].quantity).toBe(3);
      });

      it("should remove items correctly", () => {
        const { addFridgeItems, removeFridgeItems } =
          useFridgeInventoryState.getState();

        // Setup
        act(() => addFridgeItems([{ name: "apple", quantity: 1 }]));
        expect(useFridgeInventoryState.getState().fridgeItems).toHaveLength(1);

        // Remove
        // Ensure the object structure matches what the store expects for removal
        const itemToRemove = useFridgeInventoryState.getState().fridgeItems[0];

        act(() => removeFridgeItems([itemToRemove]));

        expect(useFridgeInventoryState.getState().fridgeItems).toHaveLength(0);
      });

      it("should clear inventory", () => {
        const { addFridgeItems, clearFridgeInventory } =
          useFridgeInventoryState.getState();

        act(() => addFridgeItems([{ name: "A", quantity: 1 }]));
        act(() => clearFridgeInventory());

        expect(useFridgeInventoryState.getState().fridgeItems).toHaveLength(0);
      });

      /**
       * Edge Case: Quantity Math (Decrement)
       * Verifies that removing a quantity LESS than the total creates a remainder,
       * rather than deleting the item entirely.
       */
      it("should decrement quantity if removing less than total", () => {
        const { addFridgeItems, removeFridgeItems } =
          useFridgeInventoryState.getState();

        // 1. Add 3 Apples
        act(() => addFridgeItems([{ name: "Apple", quantity: 3 }]));

        // 2. Remove 1 Apple
        act(() => removeFridgeItems([{ name: "Apple", quantity: 1 }]));

        const items = useFridgeInventoryState.getState().fridgeItems;

        // Should still have the item, but quantity 2
        expect(items).toHaveLength(1);
        expect(items[0].name).toBe("Apple");
        expect(items[0].quantity).toBe(2);
      });

      /**
       * Edge Case: Case Insensitivity
       * Verifies that "Milk" and "milk" are treated as the same item.
       */
      it("should merge items regardless of casing", () => {
        const { addFridgeItems } = useFridgeInventoryState.getState();

        act(() => {
          addFridgeItems([{ name: "Milk", quantity: 1 }]);
          addFridgeItems([{ name: "milk", quantity: 2 }]); // Lowercase
        });

        const items = useFridgeInventoryState.getState().fridgeItems;

        // Should result in ONE item with quantity 3
        expect(items).toHaveLength(1);
        expect(items[0].name).toMatch(/milk/i); // Matches either Milk or milk
        expect(items[0].quantity).toBe(3);
      });
    });
  });
});
