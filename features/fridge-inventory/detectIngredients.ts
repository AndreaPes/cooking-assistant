import { captureVideoFrame } from "@/lib/cameraUtils";

export interface FridgeItem {
  name: string;
  quantity: number;
}

export async function detectIngredientsFromImage(
  videoElement: HTMLVideoElement,
): Promise<FridgeItem[]> {
  // 1. Cattura lo screenshot
  const base64Image = captureVideoFrame(videoElement);
  if (!base64Image) {
    console.warn("Could not capture video frame");
    return [];
  }

  try {
    // 2. Chiama la TUA nuova API vision
    const res = await fetch("/api/vision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!res.ok) throw new Error("Vision API failed");

    const data = await res.json();
    return data.ingredients || [];
  } catch (error) {
    console.error("Error detecting ingredients:", error);
    return [];
  }
}
