import {create} from 'zustand';
import {Recipe, PASTA_RECIPE} from "@/data/recipes";

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
    removeTimer: (labelKeywords: string) => void;
    clearAllTimers: () => void;
}

export const useCookingState = create<CookingState>((set, get) => ({
    activeRecipe: PASTA_RECIPE,
    currentStepIndex: -1,
    shoppingList: ["Milk", "Bread"],
    activeTimers: [],

    nextStep: () => set((state) => {
        if (!state.activeRecipe) return {};
        const next = Math.min(state.currentStepIndex + 1, state.activeRecipe.steps.length - 1);
        return { currentStepIndex: next };
    }),
    prevStep: () => set((state) => ({ currentStepIndex: Math.max(state.currentStepIndex - 1, -1) })),
    addToShoppingList: (item) => set((state) => ({ shoppingList: [...state.shoppingList, item] })),
    getCurrentStepData: () => {
        const { activeRecipe, currentStepIndex } = get();
        if (!activeRecipe || currentStepIndex === -1) return null;
        return activeRecipe.steps[currentStepIndex];
    },

    // ✅ NEW IMPLEMENTATIONS
    addTimer: (seconds, label) => set((state) => ({
        activeTimers: [
            ...state.activeTimers,
            { id: Math.random().toString(36).substring(2, 11), label, seconds }
        ]
    })),

    removeTimer: (labelKeyword) => set((state) => ({
        // Remove any timer that contains the keyword (e.g., "Pasta" removes "Boil Pasta")
        activeTimers: state.activeTimers.filter(t =>
            !t.label.toLowerCase().includes(labelKeyword.toLowerCase())
        )
    })),

    clearAllTimers: () => set({ activeTimers: [] }),
}));