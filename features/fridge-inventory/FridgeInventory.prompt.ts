export const FRIDGE_INVENTORY_RULES = `
---------------------------------------------------------
🟢 RULES FOR FRIDGE INVENTORY (Voice Commands)

1. Detect if the user wants to see or scan what is in the fridge.
   - "Scan the fridge", "What ingredients do I have?", "Check inventory", "Look at the fridge".
   - -> ACTION: "scan"

2. Detect if the user wants to close/hide the inventory panel.
   - "Hide inventory", "Close fridge", "Remove list", "Hide".
   - -> ACTION: "hide"

---------------------------------------------------------
`;

export const FRIDGE_INVENTORY_JSON_FORMAT = `
Respond ONLY with a SINGLE JSON object:

{
  "intent": "FRIDGE_INVENTORY",
  "action": "scan" | "hide"
}
`;
