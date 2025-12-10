"use client";

import { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { createXRStore, XR } from "@react-three/xr";
import { OrbitControls } from "@react-three/drei";

import { useCookingAssistant } from "@/hooks/useCookingAssistant";
import { InterfaceManager } from "@/components/InterfaceManager";
import { WebcamFeed } from "@/components/WebcamFeed";

// HUD Components (Refactored Location)
import { NotificationBadge } from "@/components/hud/NotificationBadge";
import { ControlPanel } from "@/components/hud/ControlPanel";

/**
 * XR Store Configuration
 * ----------------------
 * We disable the DOM Overlay because all interactive controls (Mic, Camera Toggle)
 * have been moved into the 3D scene (ControlPanel). This ensures they remain
 * visible and clickable inside the AR headset.
 */
const store = createXRStore({
  domOverlay: false,
});

/**
 * ARScene Component
 * -----------------
 * The root container for the Augmented Reality experience.
 *
 * Architecture:
 * 1. **2D Background Layer**: Renders the Webcam feed (for phones/desktop debugging) and debug subtitles.
 * These elements are NOT visible in the immersive AR session on a headset.
 * 2. **3D AR Layer**: Renders the WebXR Canvas containing floating interfaces,
 * the control panel, and notifications. These persist in the headset.
 */
export default function ARScene() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraMode, setIsCameraMode] = useState(true);

  // Core Business Logic Hook
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
      {/* ==================================================================
          LAYER 1: 2D BACKGROUND & DEBUG
          Visible only on screens (Mobile/Desktop), hidden in Immersive AR.
         ================================================================== */}

      {/* Webcam Background (Fallback for non-passthrough devices) */}
      {isCameraMode && (
        <div className="absolute inset-0 z-0">
          <WebcamFeed videoRef={videoRef} />
        </div>
      )}

      {/* Debug Subtitles (Development only) */}
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

      {/* Standard WebXR "Enter AR" Button */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => store.enterAR()}
          className="px-4 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-full text-white font-bold hover:bg-white/20 transition"
        >
          Enter AR
        </button>
      </div>

      {/* ==================================================================
          LAYER 2: 3D SCENE (XR)
          These elements exist in 3D space and are visible in the headset.
         ================================================================== */}
      <Canvas gl={{ alpha: true }}>
        {/* OrbitControls allow mouse interaction during development */}
        <OrbitControls makeDefault />

        <XR store={store}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />

          {/* 1. 3D Control Dashboard (Mic & Camera Toggles) */}
          <ControlPanel
            status={status}
            isCameraMode={isCameraMode}
            onToggleCamera={() => setIsCameraMode(!isCameraMode)}
            onMicClick={handleMicClick}
          />

          {/* 2. Floating Notification Toasts */}
          {toastMessage && (
            <NotificationBadge label={toastMessage} variant="success" />
          )}

          {/* 3. Main Application Interfaces (Recipes, Timers, Lists) */}
          <InterfaceManager activeInterface={aiState} />
        </XR>
      </Canvas>
    </div>
  );
}
