"use client";

import { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { createXRStore, XR } from "@react-three/xr";
import { OrbitControls } from "@react-three/drei";

import { useCookingAssistant } from "@/hooks/useCookingAssistant";
import { InterfaceManager } from "@/components/InterfaceManager";
import { WebcamFeed } from "@/components/WebcamFeed";
import { NotificationBadge } from "@/components/hud/NotificationBadge";
import { ControlPanel } from "@/components/hud/ControlPanel";

/**
 * XR Store Configuration.
 * Disables DOM Overlay to ensure all controls (like Mic/Camera toggles)
 * are rendered within the 3D scene, making them accessible in VR/AR headsets.
 */
const store = createXRStore({
  domOverlay: false,
});

/**
 * Root Component for the Augmented Reality Experience.
 *
 * Architecture:
 * - **2D Layer**: Renders the webcam feed for mobile/desktop devices and debug overlays.
 * - **3D Layer (Canvas)**: Renders the immersive WebXR content using React Three Fiber.
 *
 * This component orchestrates the connection between the "Cooking Brain" (hooks)
 * and the visual presentation.
 */
export default function ARScene() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraMode, setIsCameraMode] = useState(true);

  const {
    status,
    isListening,
    transcript,
    aiState,
    toastMessage,
    handleMicClick,
  } = useCookingAssistant(videoRef);

  return (
    <div
      className={`h-full w-full relative ${isCameraMode ? "bg-transparent" : "bg-gray-900"}`}
    >
      {/* 2D Background Layer (Mobile/Desktop Only) */}
      {isCameraMode && (
        <div className="absolute inset-0 z-0">
          <WebcamFeed videoRef={videoRef} />
        </div>
      )}

      {/* Debug Subtitles */}
      {(transcript || isListening) && (
        <div className="absolute bottom-12 left-0 w-full flex justify-center z-40 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 text-white px-8 py-4 rounded-3xl text-xl font-medium shadow-2xl max-w-[85%] text-center">
            {transcript ? (
              <span>&quot;{transcript}&quot;</span>
            ) : (
              <span className="text-white/50 italic">Listening...</span>
            )}
          </div>
        </div>
      )}

      {/* Enter AR Trigger Button */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => store.enterAR()}
          className="px-4 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-full text-white font-bold hover:bg-white/20 transition"
        >
          Enter AR
        </button>
      </div>

      {/* 3D Immersive Layer */}
      <Canvas gl={{ alpha: true }}>
        <OrbitControls makeDefault />

        <XR store={store}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />

          <ControlPanel
            status={status}
            isCameraMode={isCameraMode}
            onToggleCamera={() => setIsCameraMode(!isCameraMode)}
            onMicClick={handleMicClick}
          />

          {toastMessage && (
            <NotificationBadge label={toastMessage} variant="success" />
          )}

          <InterfaceManager activeInterface={aiState} />
        </XR>
      </Canvas>
    </div>
  );
}
