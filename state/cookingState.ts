import { create } from "zustand";
import { Recipe, PASTA_RECIPE } from "@/data/recipes";

export interface TimerItem {
  id: string;
  label: string;
  seconds: number;
}

interface CookingState {
  activeRecipe: Recipe | null;
  currentStepIndex: number;
  shoppingList: string[];

  activeTimers: TimerItem[];

  // Actions
  nextStep: () => void;
  prevStep: () => void;
  addToShoppingList: (item: string) => void;
  getCurrentStepData: () => any;

  addTimer: (seconds: number, label: string) => void;
  removeTimer: (labelKeywords: string) => boolean;
  clearAllTimers: () => void;
}

export const useCookingState = create<CookingState>((set, get) => ({
  activeRecipe: PASTA_RECIPE,
  currentStepIndex: -1,
  shoppingList: ["Milk", "Bread"],
  activeTimers: [],

  nextStep: () =>
    set((state) => {
      if (!state.activeRecipe) return {};
      const next = Math.min(
        state.currentStepIndex + 1,
        state.activeRecipe.steps.length - 1,
      );
      return { currentStepIndex: next };
    }),
  prevStep: () =>
    set((state) => ({
      currentStepIndex: Math.max(state.currentStepIndex - 1, -1),
    })),
  addToShoppingList: (item) =>
    set((state) => ({ shoppingList: [...state.shoppingList, item] })),
  getCurrentStepData: () => {
    const { activeRecipe, currentStepIndex } = get();
    if (!activeRecipe || currentStepIndex === -1) return null;
    return activeRecipe.steps[currentStepIndex];
  },

  addTimer: (seconds, label) =>
    set((state) => ({
      activeTimers: [
        ...state.activeTimers,
        { id: Math.random().toString(36).substring(2, 11), label, seconds },
      ],
    })),

  removeTimer: (labelKeyword) => {
    let wasRemoved = false;
    set((state) => {
      const cleanKeyword = labelKeyword.toLowerCase().trim();

      // logic if there is only one timer
      if (state.activeTimers.length === 1) {
        console.log(
          `Single timer detected. Removing "${state.activeTimers[0].label}" (User said: "${labelKeyword}")`,
        );
        wasRemoved = true;
        // clear it immediately
        return { activeTimers: [] };
      }

      // logic for multiple timers
      const filtered = state.activeTimers.filter((t) => {
        const cleanLabel = t.label.toLowerCase().trim();
        const match =
          cleanLabel.includes(cleanKeyword) ||
          cleanKeyword.includes(cleanLabel);
        return !match;
      });

      if (filtered.length < state.activeTimers.length) {
        wasRemoved = true;
      }
      console.log(
        `🗑️ Timers before: ${state.activeTimers.length}, After: ${filtered.length}`,
      );
      return { activeTimers: filtered };
    });
    return wasRemoved;
  },

  clearAllTimers: () => set({ activeTimers: [] }),
}));
