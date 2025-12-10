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
            enum: [
              "start",
              "start_existing",
              "stop",
              "stop_all",
              "pause",
              "resume",
              "add_time",
              "subtract_time",
              "rename",
            ],
            description: `
              Operations:
              - 'start': Create NEW timer.
              - 'start_existing': Resume/Start specific IDLE timer.
              - 'stop': Delete timer.
                - 'stop_all': Delete ALL active timers.
              - 'pause': Pause a running timer.
              - 'resume': Resume a paused timer.
              - 'add_time': Add seconds to running timer.
              - 'subtract_time': Remove seconds.
              - 'rename': Change label.
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
