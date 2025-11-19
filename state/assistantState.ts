import { create } from 'zustand';

export enum AssistantStatus {
    IDLE = 'idle',             // Doing nothing
    LISTENING = 'listening',   // Microphone is on
    PROCESSING = 'processing', // Waiting for OpenAI to reply
    SPEAKING = 'speaking',     // TTS is playing (optional for later)
}

interface AssistantState {
    status: AssistantStatus;
    setStatus: (status: AssistantStatus) => void;
}

export const useAssistantState = create<AssistantState>((set) => ({
    status: AssistantStatus.IDLE,
    setStatus: (status) => set({ status }),
}));

// 2. Helper to get colors for your UI
export const getStatusColor = (status: AssistantStatus) => {
    switch (status) {
        case AssistantStatus.LISTENING: return '#ef4444'; // Red (Recording)
        case AssistantStatus.PROCESSING: return '#f59e0b'; // Orange (Thinking)
        case AssistantStatus.SPEAKING: return '#3b82f6';  // Blue (Talking)
        default: return '#ffffff'; // White (Idle)
    }
};