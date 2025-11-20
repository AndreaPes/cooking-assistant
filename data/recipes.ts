export interface RecipeStep {
    text: string;
    timerSeconds?: number;
    warning?: string;
    ingredients?: string[];
}

export interface Recipe {
    id: string;
    title: string;
    ingredients: string[];
    steps: RecipeStep[];
}

export const PASTA_RECIPE: Recipe = {
    id: 'carbonara-01',
    title: 'Classic Carbonara',
    ingredients: ['Spaghetti', 'Eggs', 'Pecorino Cheese', 'Guanciale', 'Black Pepper'],
    steps: [
        {
            text: "Boil a large pot of salted water.",
            warning: "Use a back burner if possible for safety."
        },
        {
            text: "Add spaghetti to the boiling water.",
            timerSeconds: 600,
            warning: "Water is boiling! Do not drop pasta abruptly."
        },
        {
            text: "Crisp the guanciale in a pan over medium heat while pasta cooks.",
            ingredients: ["Guanciale"]
        },
        {
            text: "Whisk eggs, cheese, and pepper in a bowl.",
            ingredients: ["Eggs", "Pecorino", "Black Pepper"]
        },
        {
            text: "Drain pasta (reserve water), mix with guanciale, remove from heat, and stir in eggs quickly.",
            warning: "Remove from heat BEFORE adding eggs to prevent scrambling!"
        },
        {
            text: "Serve immediately with extra pepper.",
        }
    ]
};