import { create } from "zustand";
import type { AIResponse } from "@/types/interfaces";

/**
 * Enumeration representing the possible operating states of the voice assistant.
 */
export enum AssistantStatus {
  /** The assistant is inactive and waiting for activation. */
  IDLE = "idle",
  /** The microphone is active and recording user input. */
  LISTENING = "listening",
  /** The system is processing the audio or waiting for an AI response. */
  PROCESSING = "processing",
}

/**
 * Interface definition for the Assistant State.
 * Manages the global status of the voice interaction and the current AI UI context.
 */
interface AssistantState {
  /** The current operational status of the assistant. */
  status: AssistantStatus;
  /**
   * Updates the assistant status.
   * @param status - The new status to set.
   */
  setStatus: (status: AssistantStatus) => void;
  /**
   * The current active interface or intent data returned by the AI.
   * Used to drive the UI (e.g., showing a specific widget).
   */
  activeInterface: AIResponse | null;
  /**
   * Sets the active AI interface data.
   * @param ai - The AI response object or null to clear it.
   */
  setActiveInterface: (ai: AIResponse | null) => void;
}

/**
 * Global store for the Voice Assistant state.
 */
export const useAssistantState = create<AssistantState>((set) => ({
  status: AssistantStatus.IDLE,
  setStatus: (status) => set({ status }),
  activeInterface: null,
  setActiveInterface: (ai) => set({ activeInterface: ai }),
}));

/**
 * Helper function to determine the UI color based on the assistant's status.
 *
 * @param status - The current status of the assistant.
 * @returns A hex color string (e.g., "#ef4444" for listening).
 */
export const getStatusColor = (status: AssistantStatus) => {
  switch (status) {
    case AssistantStatus.LISTENING:
      return "#ef4444"; // Red
    case AssistantStatus.PROCESSING:
      return "#f59e0b"; // Amber/Yellow
    default:
      return "#ffffff"; // White (Idle)
  }
};
