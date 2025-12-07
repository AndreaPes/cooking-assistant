/**
 * Cattura il frame corrente da un elemento <video> e lo restituisce come stringa Base64 (JPEG).
 * Questo serve per mandare "lo screenshot" a Gemini.
 */
export function captureVideoFrame(
  videoElement: HTMLVideoElement,
): string | null {
  if (!videoElement.videoWidth || !videoElement.videoHeight) return null;

  const canvas = document.createElement("canvas");
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Disegna il frame del video sul canvas
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  // Converte in stringa Base64 (JPEG qualità 70% per velocità)
  return canvas.toDataURL("image/jpeg", 0.7);
}
