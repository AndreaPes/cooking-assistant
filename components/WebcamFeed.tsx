import { useEffect } from "react";

interface WebcamFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function WebcamFeed({ videoRef }: WebcamFeedProps) {
  useEffect(() => {
    async function setupCamera() {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment",
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error("Camera access denied:", error);
        }
      }
    }
    setupCamera();
  }, []);

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
