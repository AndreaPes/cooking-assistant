export const TIMER_RULES = `
---------------------------------------------------------
🔴 RULES FOR STARTING TIMERS (Label Extraction):
1. You MUST try to extract a label if the user mentions a food or object.
   - "Add/Set timer for pasta" -> Label: "Pasta"
   - "Timer for the sauce" -> Label: "Sauce"
   - "Chicken timer 10 minutes" -> Label: "Chicken"
2. Only use "Timer" if the user specifies NO object.
---------------------------------------------------------

---------------------------------------------------------
🔵 RULES FOR STOPPING TIMERS (Strict Matching):
1. Check the "CURRENT ACTIVE TIMERS" list.
2. If the user's word matches an active timer phonetically or partially, use the EXISTING label.
3. If there is ONLY 1 active timer and user says "Stop timer", return that label.
4. If NO match is found, return the User's exact word.
---------------------------------------------------------
`;

export const TIMER_JSON_FORMAT = `
- Start: { "intent": "TIMER", "action": "start", "seconds": number, "label": string }
- Stop:  { "intent": "TIMER", "action": "stop", "label": string }
- Stop All: { "intent": "TIMER", "action": "stop_all" }
`;
