import { create } from "zustand";

// 1. Define Status Enums
export enum AssistantStatus {
  IDLE = "idle",
  LISTENING = "listening",
  PROCESSING = "processing",
  SPEAKING = "speaking",
}

interface AssistantState {
  status: AssistantStatus;
  setStatus: (status: AssistantStatus) => void;
}

// 2. Create the State
export const useAssistantState = create<AssistantState>((set) => ({
  status: AssistantStatus.IDLE,
  setStatus: (status) => set({ status }),
}));

// 3. Helper for UI Colors
export const getStatusColor = (status: AssistantStatus) => {
  switch (status) {
    case AssistantStatus.LISTENING:
      return "#ef4444";
    case AssistantStatus.PROCESSING:
      return "#f59e0b";
    case AssistantStatus.SPEAKING:
      return "#3b82f6";
    default:
      return "#ffffff";
  }
};
