/**
 * AI Tool Definition for managing the Fridge/Kitchen Inventory.
 *
 * This tool allows the Assistant to perform CRUD operations on the user's
 * current stock of ingredients. It includes a specific action ('scan')
 * to trigger the hardware camera for computer vision analysis.
 */
export const FRIDGE_TOOLS = [
  {
    type: "function",
    function: {
      name: "manage_fridge_inventory",
      description: `
        Controls the Fridge/Kitchen Inventory (Current Stock).
        
        USE CASES:
        1. Visual Check: "Scan fridge", "Look inside", "Check what I have", "Analyze inventory". -> Use 'scan'.
        2. Manual Add: "I bought eggs", "I have milk", "Add apples to inventory". -> Use 'add_manual'.
        3. Manual Remove: "I ate the apple", "Used up the milk", "Remove eggs". -> Use 'remove_manual'.
        4. Show UI: "Show me the fridge", "Open inventory", "What do I have?". -> Use 'show'.
        5. Close UI: "Hide fridge", "Close inventory". -> Use 'hide'.
        
        CRITICAL DISTINCTION:
        - If user says "I NEED [item]" or "Buy [item]", DO NOT use this tool (use 'manage_shopping_list' instead).
        - If user says "I HAVE [item]", use this tool.
      `,
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: [
              "scan",
              "add_manual",
              "remove_manual",
              "show",
              "clear",
              "hide",
            ],
            description: `
              The specific operation:
              - 'scan': ACTIVATES THE CAMERA module. Use immediately for visual checks.
              - 'add_manual': Adds items to stock.
              - 'remove_manual': Removes items from stock.
              - 'show': Opens the 3D inventory panel WITHOUT scanning.
              - 'clear': Deletes all items.
              - 'hide': Closes the panel.
            `,
          },
          items: {
            type: "array",
            description:
              "A COMPLETE list of EVERY single item mentioned in the user's sentence. Scan the entire sentence for conjunctions like 'and'. Do not miss any item.",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description:
                    "Item name (normalized, singular, lowercase, e.g. 'tomato').",
                },
                quantity: {
                  type: "number",
                  description:
                    "Quantity (integer). ALWAYS 1 unless a number is explicitly stated (e.g. 'two apples' -> 2). Plural words without a number (e.g. 'apples') MUST be 1.",
                },
              },
              required: ["name", "quantity"],
            },
          },
        },
        required: ["action"],
      },
    },
  },
] as const;
