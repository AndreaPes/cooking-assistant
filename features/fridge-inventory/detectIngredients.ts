import { captureVideoFrame } from "@/lib/cameraUtils";

export interface FridgeItem {
  name: string;
  quantity: number;
}

/**
 * Orchestrates the Computer Vision workflow to detect ingredients from the active camera.
 *
 * Workflow:
 * 1. Captures a single frame (screenshot) from the provided video element.
 * 2. Sends the Base64 image to the internal `/api/vision` endpoint.
 * 3. Returns the parsed JSON list of ingredients identified by the AI.
 *
 * @param videoElement - The active HTMLVideoElement source (Webcam feed).
 * @returns A Promise resolving to an array of detected `FridgeItem`s. Returns an empty array on error.
 */
export async function detectIngredientsFromImage(
  videoElement: HTMLVideoElement,
): Promise<FridgeItem[]> {
  // Capture screenshot from the video feed
  const base64Image = captureVideoFrame(videoElement);
  if (!base64Image) {
    console.warn("Could not capture video frame");
    return [];
  }

  try {
    // Call the dedicated Vision API route
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
