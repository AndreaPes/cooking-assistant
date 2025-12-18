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
 * -----------------------
 * DOM OVERLAY RIMOSSO: Ora usiamo UI 3D nativa.
 * Questo garantisce visibilità perfetta in AR (Passthrough) e VR.
 */
const store = createXRStore();

export default function ARScene() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraMode, setIsCameraMode] = useState(true);

  // Stato per sapere se siamo in AR (per nascondere elementi 2D)
  const [isInAR, setIsInAR] = useState(false);

  const [red, setRed] = useState(false);

  const {
    status,
    isListening,
    transcript,
    aiState,
    toastMessage,
    handleMicClick,
  } = useCookingAssistant(videoRef);

  return (
    // Sfondo nero per evitare flash bianchi nel visore prima del caricamento
    <div className="h-full w-full relative bg-black">
      {/* LAYER 2D: Webcam & Debug (Visibile solo su PC/Mobile, MAI nel visore AR) */}
      {isCameraMode && !isInAR && (
        <div className="absolute inset-0 z-0">
          <WebcamFeed videoRef={videoRef} />
        </div>
      )}

      {/* Tasto Enter AR (2D HTML, sparisce quando entri in AR) */}
      {!isInAR && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={() => {
              store.enterAR();
              setIsInAR(true);
            }}
            className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white font-bold hover:bg-white/20 transition shadow-xl"
          >
            👓 Enter AR
          </button>
        </div>
      )}

      {/* LAYER 3D: Tutto ciò che è qui dentro è visibile in AR */}
      <Canvas>
        <XR store={store}>
          <mesh
            pointerEventsType={{ deny: "grab" }}
            onClick={() => setRed(!red)}
            position={[0, 1, -1]}
          >
            <boxGeometry />
            <meshBasicMaterial color={red ? "red" : "blue"} />
          </mesh>
        </XR>
      </Canvas>
    </div>
  );
}
