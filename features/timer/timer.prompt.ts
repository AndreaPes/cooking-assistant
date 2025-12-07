export const TIMER_RULES = `
---------------------------------------------------------
⏱️ TIMER LOGIC & DECISION RULES:

CONTEXT:
- You receive a list of "CURRENT ACTIVE TIMERS" with their IDs, Labels, and Status (idle/running).

1. START COMMANDS ("Start timer", "Start pasta", "Go"):
   - **CHECK:** Look at the "CURRENT ACTIVE TIMERS" list.
   - **MATCH EXISTING:** Is there an IDLE timer that matches the user's label (e.g. "Egg")?
     - OR if the user just says "Start" and there is exactly one IDLE timer?
     - -> ACTION: "start_existing" | ID: <the_timer_id>
   - **CREATE NEW:** If no matching idle timer is found:
     - -> ACTION: "start" | Label: <extracted_label> | Seconds: <extracted_seconds>
   - CRITICAL: If user says generic "Start timer" or just "Start", AND there is at least one IDLE timer, you MUST return action: "start_existing" with that timer's ID. Do NOT create a new timer labeled "timer".

2. STOP COMMANDS ("Stop timer", "Stop egg"):
   - **CHECK:** Look at the "CURRENT ACTIVE TIMERS" list.
   - **MATCH:** Find the running timer that matches the label.
     - -> ACTION: "stop" | ID: <the_timer_id>

3. TIMING LOGIC:
   - If user says "10 minutes", seconds = 600.
   - If no time is specified for a NEW timer, default to 0 (app will ask or use default).

4. LABELS:
   - Extract food/object name (e.g., "Pasta", "Egg").
   - If specific ("Timer 1"), use that.
---------------------------------------------------------
`;

export const TIMER_JSON_FORMAT = `
Respond ONLY with a SINGLE JSON object:

{
  "intent": "TIMER",
  "action": "start" | "start_existing" | "stop" | "stop_all",
  "id": "string",
  "label": "string",
  "seconds": number
}
`;
