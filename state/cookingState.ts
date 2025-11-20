import { create } from "zustand";
import { createTimerSlice, TimerSlice } from "./slices/timerSlice";

export const useCookingState = create<TimerSlice>()((...a) => ({
  ...createTimerSlice(...a),
}));
