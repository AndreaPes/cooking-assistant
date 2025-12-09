import { create } from "zustand";
import type { AIResponse } from "@/types/interfaces";

// 1. Define Status Enums
export enum AssistantStatus {
  IDLE = "idle",
  LISTENING = "listening",
  PROCESSING = "processing",
}

interface AssistantState {
  status: AssistantStatus;
  setStatus: (status: AssistantStatus) => void;
  activeInterface: AIResponse | null;
  setActiveInterface: (ai: AIResponse | null) => void;
}

// 2. Create the State
export const useAssistantState = create<AssistantState>((set) => ({
  status: AssistantStatus.IDLE,
  setStatus: (status) => set({ status }),
  activeInterface: null,
  setActiveInterface: (ai) => set({ activeInterface: ai }),
}));

// 3. Helper for UI Colors
export const getStatusColor = (status: AssistantStatus) => {
  switch (status) {
    case AssistantStatus.LISTENING:
      return "#ef4444";
    case AssistantStatus.PROCESSING:
      return "#f59e0b";
    default:
      return "#ffffff";
  }
};
