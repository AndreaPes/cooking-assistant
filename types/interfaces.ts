export type InterfaceType =
  | "instruction"
  | "timer"
  | "shopping_list"
  | "warning"
  | "success"
  | "idle"
  | "error";

// Specific data shapes per interface type (discriminated union)
export interface InstructionResponse {
  type: "instruction";
  data: {
    text: string; // Text to show to the user
  };
  voiceResponse?: string;
}

export interface TimerResponse {
  type: "timer";
  data: {
    seconds: number; // seconds for the timer
    label?: string; // optional label (e.g. "Pasta")
    id?: string; // optional id for matching existing timers
  };
  voiceResponse?: string;
}

export interface ShoppingListResponse {
  type: "shopping_list";
  data: {
    // Minimal fields used by the UI factory. Add more if your UI needs them.
    label?: string;
    quantity?: number;
    // Optionally provide items when the AI returns the whole list
    items?: Array<{ label: string; quantity?: number | null }>;
  };
  voiceResponse?: string;
}

export interface NotificationResponse {
  type: "warning" | "success" | "error" | "idle";
  data: {
    text?: string;
    label?: string;
  };
  voiceResponse?: string;
}

// The discriminated union that callers should use.
export type AIResponse = InstructionResponse | TimerResponse | ShoppingListResponse | NotificationResponse;

/* Usage notes:
 - In code, narrow by `response.type` (switch or if) before accessing type-specific fields.
 - Example:
     if (resp.type === 'shopping_list') {
       // TS knows resp.data may have `items`, `id`, `label` here
     }
 - This avoids optional casts like `data.seconds!` and makes the shapes explicit.
*/
