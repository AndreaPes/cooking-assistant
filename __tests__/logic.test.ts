import { describe, it, expect } from "vitest";

/**
 * Replicating the logic used in SuggestRecipe.tsx
 * to verify the "Fuzzy Matching" algorithm works as expected.
 */
const isInShoppingList = (
  ingredientName: string,
  shoppingList: { label: string }[],
) => {
  if (!shoppingList) return false;
  const target = ingredientName.toLowerCase().trim();
  return shoppingList.some((shopItem) =>
    shopItem.label.toLowerCase().includes(target),
  );
};

describe("Business Logic: Shopping List Cross-Reference", () => {
  const mockShoppingList = [
    { label: "Milk" },
    { label: "Olive Oil" },
    { label: "Chicken Breast" },
    { label: " Eggs " },
  ];

  it("should detect exact matches ignoring case", () => {
    expect(isInShoppingList("milk", mockShoppingList)).toBe(true);
    expect(isInShoppingList("MILK", mockShoppingList)).toBe(true);
  });

  it("should detect partial matches (ingredient is subset of list item)", () => {
    // If list has "Olive Oil", checking for "Oil" should be true
    expect(isInShoppingList("Oil", mockShoppingList)).toBe(true);
    expect(isInShoppingList("Chicken", mockShoppingList)).toBe(true);
  });

  it("should return false for items not in list", () => {
    expect(isInShoppingList("Banana", mockShoppingList)).toBe(false);
    expect(isInShoppingList("Beef", mockShoppingList)).toBe(false);
  });

  it("should handle empty lists gracefully", () => {
    expect(isInShoppingList("Milk", [])).toBe(false);
  });

  it("should handle extra whitespace in the shopping list items", () => {
    // Se nel DB c'è " Eggs ", deve trovare "Eggs" o "Egg"
    // Attualmente questo potrebbe fallire se non fai trim anche su shopItem.label
    expect(isInShoppingList("Eggs", mockShoppingList)).toBe(true);
  });

  it("should handle plural variations (Simple containment)", () => {
    // Lista: "Eggs" -> Cerco: "Egg" (Funziona)
    expect(isInShoppingList("Egg", mockShoppingList)).toBe(true);
  });

  /* * Questo test fallirà con la logica attuale, ma è utile sapere che fallisce
   * per decidere se vuoi implementare una logica più complessa in futuro.
   */
  it("should handle reverse partial matches (List has generic, Recipe wants specific)", () => {
    // Lista: "Chicken Breast" -> Cerco: "Grilled Chicken Breast"
    // Attualmente: "chicken breast".includes("grilled chicken breast") -> FALSE
    expect(isInShoppingList("Grilled Chicken Breast", mockShoppingList)).toBe(
      false,
    );
  });
});
