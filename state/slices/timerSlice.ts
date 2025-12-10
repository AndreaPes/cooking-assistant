import { StateCreator } from "zustand";

export interface TimerItem {
  id: string;
  label: string;
  seconds: number;
  totalSeconds: number;
  status: "idle" | "running" | "paused" | "finished";
  stepId?: string;
}

export interface TimerSlice {
  activeTimers: TimerItem[];

  // Actions
  addTimer: (
    seconds: number,
    label: string,
    autoStart?: boolean,
    stepId?: string,
  ) => void;
  startTimer: (id: string) => void;
  pauseTimer: (id: string) => void;
  resumeTimer: (id: string) => void;
  stopTimer: (id: string) => void;
  adjustTimer: (id: string, deltaSeconds: number) => void;
  renameTimer: (id: string, newLabel: string) => void;

  removeTimerById: (id: string) => void;
  clearAllTimers: () => void;
  clearIdleStepTimers: () => void;
}

export const createTimerSlice: StateCreator<TimerSlice> = (set) => ({
  activeTimers: [],

  // Adds a NEW timer
  addTimer: (seconds, label, autoStart = true, stepId) =>
    set((state) => {
      if (stepId && state.activeTimers.some((t) => t.stepId === stepId)) {
        return { activeTimers: state.activeTimers };
      }

      return {
        activeTimers: [
          ...state.activeTimers,
          {
            id: Math.random().toString(36).substring(2, 11),
            label,
            seconds,
            totalSeconds: seconds,
            status: autoStart ? "running" : "idle",
            stepId,
          },
        ],
      };
    }),

  // Starts a specific timer by exact ID (AI decided which one)
  startTimer: (id) =>
    set((state) => ({
      activeTimers: state.activeTimers.map((t) =>
        t.id === id ? { ...t, status: "running" } : t,
      ),
    })),

  pauseTimer: (id) =>
    set((state) => ({
      activeTimers: state.activeTimers.map((t) =>
        t.id === id ? { ...t, status: "paused" } : t,
      ),
    })),

  resumeTimer: (id) =>
    set((state) => ({
      activeTimers: state.activeTimers.map((t) =>
        t.id === id ? { ...t, status: "running" } : t,
      ),
    })),

  stopTimer: (id) =>
    set((state) => ({
      activeTimers: state.activeTimers.filter((t) => t.id !== id),
    })),

  adjustTimer: (id, deltaSeconds) =>
    set((state) => ({
      activeTimers: state.activeTimers.map((t) => {
        if (t.id !== id) return t;
        const newTotal = Math.max(0, t.seconds + deltaSeconds);
        return { ...t, seconds: newTotal };
      }),
    })),

  renameTimer: (id, newLabel) =>
    set((state) => ({
      activeTimers: state.activeTimers.map((t) =>
        t.id === id ? { ...t, label: newLabel } : t,
      ),
    })),

  removeTimerById: (id) =>
    set((state) => ({
      activeTimers: state.activeTimers.filter((t) => t.id !== id),
    })),

  clearAllTimers: () => set({ activeTimers: [] }),

  clearIdleStepTimers: () =>
    set((state) => ({
      activeTimers: state.activeTimers.filter((t) => {
        return !(t.stepId && t.status === "idle");
      }),
    })),
});
