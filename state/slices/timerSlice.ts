import { StateCreator } from "zustand";

/**
 * Represents a single cooking timer.
 */
export interface TimerItem {
  /** Unique identifier for the timer. */
  id: string;
  /** Descriptive label (e.g., "Pasta"). */
  label: string;
  /** Current remaining duration in seconds. */
  seconds: number;
  /** Initial total duration in seconds. */
  totalSeconds: number;
  /** Current operating status of the timer. */
  status: "idle" | "running" | "paused" | "finished";
  /** Optional ID of the recipe step associated with this timer. */
  stepId?: string;
}

/**
 * Interface definition for the Timer Slice.
 * Manages the creation, control, and removal of multiple concurrent timers.
 */
export interface TimerSlice {
  /** List of all active timers. */
  activeTimers: TimerItem[];

  /**
   * Creates and adds a new timer to the list.
   *
   * @param seconds - Duration in seconds.
   * @param label - Name of the timer.
   * @param autoStart - Whether to start the timer immediately (default: true).
   * @param stepId - Optional ID linking the timer to a specific recipe step.
   */
  addTimer: (
    seconds: number,
    label: string,
    autoStart?: boolean,
    stepId?: string,
  ) => void;

  /**
   * Starts or resumes a specific timer.
   * @param id - The ID of the timer to start.
   */
  startTimer: (id: string) => void;

  /**
   * Pauses a running timer.
   * @param id - The ID of the timer to pause.
   */
  pauseTimer: (id: string) => void;

  /**
   * Resumes a paused timer.
   * @param id - The ID of the timer to resume.
   */
  resumeTimer: (id: string) => void;

  /**
   * Stops and removes a specific timer from the list.
   * @param id - The ID of the timer to stop.
   */
  stopTimer: (id: string) => void;

  /**
   * Adjusts the remaining time of a timer.
   * Useful for adding or subtracting time (e.g., "Add 5 minutes").
   *
   * @param id - The ID of the timer to adjust.
   * @param deltaSeconds - The amount of seconds to add (positive) or remove (negative).
   */
  adjustTimer: (id: string, deltaSeconds: number) => void;

  /**
   * Renames an existing timer.
   *
   * @param id - The ID of the timer to rename.
   * @param newLabel - The new name for the timer.
   */
  renameTimer: (id: string, newLabel: string) => void;

  /**
   * Removes a timer by its ID. Alias for stopTimer logic.
   * @param id - The ID of the timer to remove.
   */
  removeTimerById: (id: string) => void;

  /**
   * Clears all timers from the state.
   */
  clearAllTimers: () => void;

  /**
   * Removes only the timers associated with a specific step that are currently idle.
   */
  clearIdleStepTimers: () => void;
}

/**
 * Slice creator for the Timer state.
 * Implements logic for managing cooking timers via user commands or AI actions.
 *
 * @param set - The Zustand set function.
 */
export const createTimerSlice: StateCreator<TimerSlice> = (set) => ({
  activeTimers: [],

  addTimer: (seconds, label, autoStart = true, stepId) =>
    set((state) => {
      // Prevent duplicates for the same step
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
