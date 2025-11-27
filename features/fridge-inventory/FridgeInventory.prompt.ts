// FridgeInventory.prompt.ts
export const FRIDGE_INVENTORY_RULES = `
---------------------------------------------------------
🟢 RULES FOR FRIDGE INVENTORY (Voice Commands)

1. Detect if the user wants to interact with the fridge inventory.
2. Possible actions:
   - "scan": user wants to scan the fridge and list ingredients.
   - "hide": user wants to hide/close the fridge inventory box.
3. Recognize phrases like:
   - Scan fridge: "Scan my fridge", "Do fridge inventory", "Check fridge contents"
   - Hide fridge: "Hide fridge items", "Close fridge inventory", "Remove fridge box"

---------------------------------------------------------
🟡 OUTPUT RULES

1. Return ONLY JSON.
2. JSON format:

{
  "intent": "FRIDGE_INVENTORY",
  "action": "scan" | "hide"
}
`;

export const FRIDGE_INVENTORY_JSON_FORMAT = `
{
  "intent": "FRIDGE_INVENTORY",
  "action": "scan"
}
`;
