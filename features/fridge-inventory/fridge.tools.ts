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
        4. Close UI: "Hide fridge", "Close inventory". -> Use 'hide'.
        
        CRITICAL DISTINCTION:
        - If user says "I NEED [item]" or "Buy [item]", DO NOT use this tool (use 'manage_shopping_list' instead).
        - If user says "I HAVE [item]", use this tool.
      `,
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["scan", "add_manual", "remove_manual", "clear", "hide"],
            description: `
              The specific operation:
              - 'scan': ACTIVATES THE CAMERA module. Use immediately for visual checks.
              - 'add_manual': Adds items to stock.
              - 'remove_manual': Removes items from stock.
              - 'clear': Deletes all items.
              - 'hide': Closes the panel.
            `,
          },
          items: {
            type: "array",
            description:
              "List of items involved in the manual action. Required for 'add_manual' and 'remove_manual'.",
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
                  description: "Quantity (integer). Default to 1.",
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
