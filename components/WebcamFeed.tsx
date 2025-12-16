import { RefObject, useEffect } from "react";

interface WebcamFeedProps {
  /** Reference to the video HTML element where the stream will be attached. */
  videoRef: RefObject<HTMLVideoElement | null>;
}

/**
 * 2D Background Component for Video Passthrough.
 * Connects to the user's camera via `navigator.mediaDevices.getUserMedia`
 * and streams the feed to a video element.
 *
 * This serves as the background layer for non-immersive AR modes (e.g., on mobile or desktop).
 */
export function WebcamFeed({ videoRef }: WebcamFeedProps) {
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function setupCamera() {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });

          currentStream = stream;

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error("Camera access denied:", error);
        }
      }
    }

    setupCamera();

    return () => {
      // Cleanup: Stop all tracks and clear the video source
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [videoRef]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="absolute top-0 left-0 w-full h-full object-cover z-0"
    />
  );
}
