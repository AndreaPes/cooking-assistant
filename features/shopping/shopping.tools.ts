/**
 * AI Tool Definition for managing the Shopping List.
 *
 * This tool empowers the Assistant to ADD, REMOVE, SHOW, or HIDE items
 * from the shopping list. It enforces strict separation between "Fridge" (Inventory)
 * and "Shopping" (To-Buy List) logic.
 */
export const SHOPPING_TOOLS = [
  {
    type: "function",
    function: {
      name: "manage_shopping_list",
      description: `
        Manages the Grocery/Shopping List.
        
        USE CASES:
        1. User intends to BUY something: "Add milk", "I need eggs", "We are out of pasta", "Buy tomatoes".
        2. User wants to CHECK the list: "Show shopping list", "What do I need to buy?", "Open list".
        3. User wants to CLOSE the list: "Hide list", "Close", "Back to cooking".
        
        CRITICAL RULES:
        - CONTEXT CHECK: If user says "I HAVE apples", use 'manage_fridge_inventory'. If user says "I NEED apples", use this tool.
        - VISUALS ONLY: If user asks to see/read the list, ALWAYS use action='show'. NEVER read the list aloud in text.
      `,
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["add", "remove", "clear", "show", "hide"],
            description: `
              The specific operation:
              - 'add': Adds an item to the list. Use this when user says "Add X", "Need X", "Buy X". Even if X is already in the list, use 'add'. NEVER use 'remove' for an add command.
              - 'remove': Removes/Checks off an item. ONLY use when user says "Remove X", "Delete X", "I bought X", "I have X", "Check off X".
              - 'show': Shows the list.
              - 'hide': Hides the list.
              - 'clear': Clears the list.
            `,
          },
          item: {
            type: "string",
            description:
              "Item name (normalized, singular, lowercase, e.g. 'banana'). Required for 'add'/'remove'.",
          },
          quantity: {
            type: "number",
            description: "Quantity (integer). Default to 1 if not specified.",
          },
        },
        required: ["action"],
      },
    },
  },
] as const;
