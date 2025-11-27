// features/fridge-inventory/detectIngredients.ts
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

export interface FridgeItem {
    name: string;
    quantity: number;
}

/**
 * Detect ingredients from an HTMLVideoElement or HTMLImageElement
 */
export async function detectIngredientsFromImage(
    videoOrImage: HTMLVideoElement | HTMLImageElement
): Promise<FridgeItem[]> {
    // 1. Load the model (cache in memory)
    const model = await cocoSsd.load();

    // 2. Run detection
    const predictions = await model.detect(videoOrImage);

    // 3. Filter by confidence (ad esempio >= 0.5)
    const filtered = predictions.filter(p => p.score >= 0.5);

    // 4. Group and count quantity
    const counts: Record<string, number> = {};
    filtered.forEach(p => {
        const name = p.class.toLowerCase(); // es. "apple"
        counts[name] = (counts[name] || 0) + 1;
    });

    const items: FridgeItem[] = Object.entries(counts).map(([name, quantity]) => ({
        name,
        quantity,
    }));

    return items;
}
