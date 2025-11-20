import { StateCreator } from "zustand";

export interface TimerItem {
  id: string;
  label: string;
  seconds: number;
}

export interface TimerSlice {
  activeTimers: TimerItem[];
  addTimer: (seconds: number, label: string) => void;
  removeTimer: (labelKeywords: string) => boolean;
  removeTimerById: (id: string) => void;
  clearAllTimers: () => void;
}

export const createTimerSlice: StateCreator<TimerSlice> = (set) => ({
  activeTimers: [],

  // Adds a timer to the active timers
  addTimer: (seconds, label) =>
    set((state) => ({
      activeTimers: [
        ...state.activeTimers,
        { id: Math.random().toString(36).substring(2, 11), label, seconds },
      ],
    })),

  // Removes a specific timer through guesswork/fuzzy matching
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

      const exactMatchExists = state.activeTimers.some(
        (t) => t.label.toLowerCase().trim() === cleanKeyword,
      );

      if (exactMatchExists) {
        const filtered = state.activeTimers.filter((t) => {
          return t.label.toLowerCase().trim() !== cleanKeyword;
        });
        wasRemoved = true;
        return { activeTimers: filtered };
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

  // Removes a specific timer by its id
  removeTimerById: (id) =>
    set((state) => ({
      activeTimers: state.activeTimers.filter((t) => t.id !== id),
    })),

  clearAllTimers: () => set({ activeTimers: [] }),
});
