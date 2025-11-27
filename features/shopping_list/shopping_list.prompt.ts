export const SHOPPING_LIST_RULES = `
// SHOPPING_LIST Intent Rules:

1. ADD ITEM (action: "add"):
- Triggers (EN/IT): add, put, buy, get, need, on the list, aggiungi, metti, compra, prendi, mi serve.
- Item format: MUST be **English, lowercase, singular**, standard grocery label. (e.g., uova/eggs -> egg, latte intero -> milk, Barilla pasta n.5 -> pasta). Translate Italian input first.
- Quantity: Use spoken number (digit or word) or default to 1.
- Output: Always ONE item per utterance.

2. REMOVE ONE ITEM (action: "remove"):
- Triggers (EN/IT): remove, delete, take off, no more X, rimuovi, togli, cancella, non voglio più X.
- Ignore quantity. Match to **CURRENT ACTIVE SHOPPING LIST** item if possible; otherwise, normalize using the same Item format as Rule 1.

3. CLEAR ALL ITEMS (action: "clear"):
- Triggers (EN/IT): clear the list, delete everything, empty the list, svuota la lista, cancella tutto, togli tutto.
- No item, no quantity.

4. SHOW LIST (action: "show"):
- Triggers (EN/IT): show the list, what's on the list, read the list, fammi vedere la lista, mostrami la lista, cosa c'è in lista, dimmi cosa c'è in lista.
- No item, no quantity.

// GENERAL RULES:
- intent is ALWAYS: "SHOPPING_LIST".
- action is ALWAYS one of: "add" | "remove" | "clear" | "show".
- Output MUST be a single JSON object in the exact format described below.
- Do NOT include explanations, text, or comments outside the JSON.
`;

export const SHOPPING_LIST_JSON_FORMAT = `
- Add item:
  {
    "intent": "SHOPPING_LIST",
    "action": "add",
    "item": string,        // normalized, English, lowercase, singular item name (standard label)
    "quantity": number     // 1 if not explicitly specified
  }

- Remove single item:
  {
    "intent": "SHOPPING_LIST",
    "action": "remove",
    "item": string         // normalized, English, lowercase, singular item name (matched to CURRENT SHOPPING LIST if possible)
  }

- Clear all items:
  {
    "intent": "SHOPPING_LIST",
    "action": "clear"
  }

- Show full list:
  {
    "intent": "SHOPPING_LIST",
    "action": "show"
  }
`;
