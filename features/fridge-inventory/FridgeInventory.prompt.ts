export const FRIDGE_INVENTORY_RULES = `
---------------------------------------------------------
🟢 RULES FOR FRIDGE INVENTORY (Voice Commands)

1. MANUAL ADD (Voice Update):
   - Phrases: "In my kitchen I also have [Items]", "Add [Items]", "I bought [Items]".
   - -> ACTION: "add_manual"

2. MANUAL REMOVE (Voice Update):
   - Trigger: User consumed something or wants to correct the list.
   - Phrases: "Remove [Items]", "I used [Items]", "Delete [Items]", "No more [Items]".
   - **QUANTITY LOGIC:**
     - You MUST detect numbers written as words: "one"->1, "two"->2, "a couple"->2, "a"->1.
     - If quantity is specified (e.g. "Remove one banana", "Remove 2 eggs"): Use that number.
     - ONLY If NO quantity is specified (e.g. "Remove eggs"): Use quantity 999 (Implying "Remove All").
   - -> ACTION: "remove_manual"

3. VISUAL SCAN:
   - Phrases: "Scan the fridge", "Check inventory".
   - -> ACTION: "scan"

4. CLEAR ALL:
   - Phrases: "Clear inventory", "Empty fridge".
   - -> ACTION: "clear"

5. HIDE:
   - Phrases: "Hide", "Close".
   - -> ACTION: "hide"

---------------------------------------------------------
`;

export const FRIDGE_INVENTORY_JSON_FORMAT = `
Respond ONLY with a SINGLE JSON object:

{
  "intent": "FRIDGE_INVENTORY",
  "action": "scan" | "hide" | "add_manual" | "remove_manual" | "clear",
  
  // Only for "add_manual" or "remove_manual":
  "items": [
    { "name": "string", "quantity": number }
  ]
}
`;
