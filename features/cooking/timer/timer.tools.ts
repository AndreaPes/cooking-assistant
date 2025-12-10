/**
 * AI Tool Definitions for managing Cooking Timers.
 *
 * This tool gives the Assistant the ability to:
 * 1. Create new timers (Action: 'start').
 * 2. Resume or Start existing idle timers (Action: 'start_existing').
 * 3. Stop or Delete timers (Action: 'stop').
 * 4. Clear all active timers.
 */
export const TIMER_TOOLS = [
  {
    type: "function",
    function: {
      name: "manage_timer",
      description:
        "Controls cooking timers. Use this tool whenever the user wants to set time, start a countdown, or stop a timer.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["start", "start_existing", "stop", "stop_all"],
            description: `
              The specific operation to perform:
              - 'start': Creates a NEW timer. Use this if the user specifies a duration (e.g. '10 minutes') or says 'new timer'.
              - 'start_existing': Resumes/Starts a specific IDLE timer found in the context. PRIORITY: Use this if user says 'Start' and there is a matching IDLE timer.
              - 'stop': Pauses or deletes a timer. ONLY use this if user explicitly says 'Stop', 'Cancel', 'Delete'.
              - 'stop_all': Clears all timers.
            `,
          },
          label: {
            type: "string",
            description:
              "The label/name of the timer (e.g. 'pasta', 'chicken'). Normalize to singular lowercase.",
          },
          seconds: {
            type: "number",
            description:
              "Duration in seconds. REQUIRED for 'start' (e.g. 10 mins -> 600). If a range is given (e.g. '15-20 mins'), use the LOWER value.",
          },
          id: {
            type: "string",
            description:
              "The specific Timer ID. REQUIRED for 'start_existing' and 'stop'. Extract this from the 'Active Timers' list in the context.",
          },
        },
        required: ["action"],
      },
    },
  },
] as const;
