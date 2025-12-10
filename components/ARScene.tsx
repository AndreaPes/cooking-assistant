"use client";

import { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { createXRStore, XR } from "@react-three/xr";
import { OrbitControls } from "@react-three/drei";

import { useCookingAssistant } from "@/hooks/useCookingAssistant";
import { AssistantStatus } from "@/state/assistantState";

import { InterfaceManager } from "@/components/InterfaceManager";
import { WebcamFeed } from "@/components/WebcamFeed";
import { NotificationBadge } from "@/features/notifications/NotificationBadge";

const store = createXRStore({ domOverlay: true });

/**
 * ARScene Component
 * -----------------
 * The main container for the Augmented Reality experience.
 * It is a "Dumb Component" that delegates all business logic to `useCookingAssistant`.
 *
 * Structure:
 * 1. Background: Webcam Feed (2D).
 * 2. HUD Layer: Microphone, Camera Toggle, Toasts (2D Overlay).
 * 3. AR Layer: 3D Canvas containing floating interfaces (Timers, Recipes, Lists).
 */
export default function ARScene() {
  // References for Computer Vision
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraMode, setIsCameraMode] = useState(true);

  // --- BUSINESS LOGIC HOOK ---
  const {
    status,
    isListening,
    transcript,
    aiState,
    toastMessage,
    handleMicClick,
  } = useCookingAssistant(videoRef); // Pass ref for Fridge Scanning

  // --- MIC DYNAMIC STYLES ---
  const getMicStyles = () => {
    switch (status) {
      case AssistantStatus.LISTENING:
        return "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse scale-110";
      case AssistantStatus.PROCESSING:
        return "bg-yellow-400 text-black shadow-[0_0_30px_rgba(250,204,21,0.6)] animate-spin-slow";
      default: // IDLE
        return "bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-md";
    }
  };

  return (
    <div className="h-full w-full relative bg-gray-900">
      {/* 1. BACKGROUND LAYER (Webcam) */}
      {isCameraMode && <WebcamFeed videoRef={videoRef} />}

      {/* 2. HUD LAYER (2D Overlay Controls) */}
      <div className="absolute z-50 top-6 right-6 flex items-center gap-6">
        {/* Camera Toggle Button */}
        <button
          onClick={() => setIsCameraMode(!isCameraMode)}
          className={`
            w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out shadow-lg
            ${isCameraMode ? "bg-green-500" : "bg-gray-600/80 backdrop-blur"}
          `}
          aria-label="Toggle Camera"
        >
          <div
            className={`
              w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-[cubic-bezier(0.4,0.0,0.2,1)]
              ${isCameraMode ? "translate-x-6" : "translate-x-0"}
            `}
          />
        </button>

        {/* Microphone Button */}
        <button
          onClick={handleMicClick}
          className={`
            w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl
            ${getMicStyles()}
          `}
          aria-label="Activate Voice"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={`w-8 h-8 transition-transform duration-300 ${status === AssistantStatus.LISTENING ? "scale-110" : "scale-100"}`}
          >
            <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
            <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 9.303V21a.75.75 0 0 1-1.5 0v-2.197A6.751 6.751 0 0 1 5.25 12.75v-1.5a.75.75 0 0 1 .75-.75Z" />
          </svg>
        </button>
      </div>

      {/* Live Subtitles */}
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

      {/* 3. AR LAYER (3D Scene) */}
      <Canvas gl={{ alpha: true }}>
        <OrbitControls makeDefault />
        <XR store={store}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />

          {/* Toast Notifications (HUD) */}
          {toastMessage && (
            <NotificationBadge label={toastMessage} variant="success" />
          )}

          <InterfaceManager
            activeInterface={aiState}
            // toastMessage is now handled in the HUD layer
          />
        </XR>
      </Canvas>
    </div>
  );
}
