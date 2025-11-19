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
        return {currentStepIndex: next};
    }),
    prevStep: () => set((state) => ({currentStepIndex: Math.max(state.currentStepIndex - 1, -1)})),
    addToShoppingList: (item) => set((state) => ({shoppingList: [...state.shoppingList, item]})),
    getCurrentStepData: () => {
        const {activeRecipe, currentStepIndex} = get();
        if (!activeRecipe || currentStepIndex === -1) return null;
        return activeRecipe.steps[currentStepIndex];
    },

    // ✅ NEW IMPLEMENTATIONS
    addTimer: (seconds, label) => set((state) => ({
        activeTimers: [
            ...state.activeTimers,
            {id: Math.random().toString(36).substring(2, 11), label, seconds}
        ]
    })),

    removeTimer: (labelKeyword) => set((state) => {
        const cleanKeyword = labelKeyword.toLowerCase().trim();

        const filtered = state.activeTimers.filter(t => {
            const cleanLabel = t.label.toLowerCase().trim();

            // Check 1: Does the timer label contain the spoken word? (Standard)
            // e.g. Timer: "Tomato Sauce", Keyword: "Sauce" -> Match
            const match1 = cleanLabel.includes(cleanKeyword);

            // Check 2: Does the spoken word contain the timer label? (Fixes "Past" vs "Pasta")
            // e.g. Timer: "Past", Keyword: "Pasta" -> Match
            const match2 = cleanKeyword.includes(cleanLabel);

            // If EITHER matches, we remove it (so return false to filter it out)
            return !(match1 || match2);
        });

        console.log(`🗑️ Timers before: ${state.activeTimers.length}, After: ${filtered.length}`);
        return { activeTimers: filtered };
    }),

    clearAllTimers: () => set({activeTimers: []}),
}));