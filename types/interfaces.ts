export type InterfaceType = 'instruction' | 'timer' | 'warning' | 'success' | 'idle';

// This is the shape of the JSON the AI *must* return
export interface AIResponse {
    type: InterfaceType;
    data: {
        text?: string;      // For instructions/warnings
        seconds?: number;   // For timers
        label?: string;     // For timers (e.g. "Pasta")
    };
    voiceResponse: string; // What the AI should speak back (optional for now)
}