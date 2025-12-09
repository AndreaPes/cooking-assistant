export const COOKING_TOOLS = [
  // Tool 1: Start Cooking (Generazione Step)
  {
    type: "function",
    function: {
      name: "generate_cooking_steps",
      description: `
        Converts a recipe into a sequence of ATOMIC AR STEPS.
        
        TRIGGER: User says "Start cooking", "Let's begin", "Start recipe".
        CONTEXT: User MUST have selected a recipe first.
        
        OUTPUT RULES:
        - Break down complex paragraphs into single, short actions.
        - Verbs and Objects must be UPPERCASE for the HUD display.
        - Detect Safety Hazards aggressively.
      `,
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The title of the recipe being started.",
          },
          steps: {
            type: "array",
            description: "Ordered list of atomic steps.",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "Sequential ID (e.g. 's1', 's2').",
                },

                actionVerb: {
                  type: "string",
                  description:
                    "Single UPPERCASE verb (e.g. BOIL, CHOP, FRY, MIX). Keep it short.",
                },

                targetObject: {
                  type: "string",
                  description:
                    "The main object being acted upon, UPPERCASE (e.g. WATER, ONION, CHICKEN).",
                },

                details: {
                  type: "string",
                  description:
                    "Clear, concise instructions for the user to read.",
                },

                timerSeconds: {
                  type: "number",
                  description:
                    "Time in seconds (integer). CRITICAL LOGIC: If a time RANGE is given (e.g. '15-20 mins'), ALWAYS use the LOWER value (e.g. 15 mins -> 900). If no time, use 0.",
                },

                warning: {
                  type: "string",
                  description:
                    "SAFETY HAZARD ALERT. Mandatory for: Hot Oil, Boiling Water, Sharp Knives, Raw Meat, High Heat. If present, return short UPPERCASE warning (e.g. 'HOT OIL'). Return null ONLY if completely safe.",
                },
              },
              required: ["id", "actionVerb", "targetObject", "details"],
            },
          },
        },
        required: ["title", "steps"],
      },
    },
  },

  // Tool 2: Navigation
  {
    type: "function",
    function: {
      name: "navigate_steps",
      description: `
        Controls the AR Step Guide navigation. 
        USE CASE: User wants to move through the steps while cooking.
        
        TRIGGERS:
        - "Next", "Continue", "Done" -> direction: 'next'
        - "Back", "Previous", "Wait" -> direction: 'prev'
        - "Repeat", "Read again" -> direction: 'jump' (to current index)
        - "Go to step X", "Start over" -> direction: 'jump'
      `,
      parameters: {
        type: "object",
        properties: {
          direction: {
            type: "string",
            enum: ["next", "prev", "jump"],
            description: "The direction to move.",
          },
          target: {
            type: "string",
            description:
              "The target step number (1-based index) or keyword ('first', 'last'). REQUIRED if direction is 'jump'.",
          },
        },
        required: ["direction"],
      },
    },
  },
] as const;
