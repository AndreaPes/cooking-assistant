"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { createXRStore, XR } from "@react-three/xr";
import { OrbitControls } from "@react-three/drei";

import { useCookingAssistant } from "@/hooks/useCookingAssistant";
import { InterfaceManager } from "@/components/InterfaceManager";
import { NotificationBadge } from "@/components/hud/NotificationBadge";
import { ControlPanel } from "@/components/hud/ControlPanel";

const store = createXRStore();

export default function ARScene() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Stato sincronizzato con la sessione XR
  const [isInAR, setIsInAR] = useState(false);

  const {
    status,
    isListening,
    transcript,
    aiState,
    toastMessage,
    handleMicClick,
  } = useCookingAssistant(videoRef);

  // 👇 FIX: Sincronizzazione corretta dello stato AR
  useEffect(() => {
    // Ci iscriviamo ai cambiamenti dello store.
    // Se 'state.session' esiste, siamo in AR.
    const unsubscribe = store.subscribe((state) => {
      setIsInAR(!!state.session);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="h-full w-full relative bg-black">
      {/* Tasto Enter AR (Sparisce in AR) */}
      {!isInAR && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={() => store.enterAR()}
            className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white font-bold hover:bg-white/20 transition shadow-xl"
          >
            👓 Enter AR
          </button>
        </div>
      )}

      {/* LAYER 3D */}
      <Canvas gl={{ alpha: true }}>
        <OrbitControls makeDefault />

        {/* 👇 FIX: Rimossa la prop 'onSessionEnd' che causava l'errore */}
        <XR store={store}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />

          <ControlPanel status={status} onMicClick={handleMicClick} />

          {toastMessage && (
            <NotificationBadge label={toastMessage} variant="success" />
          )}

          <InterfaceManager activeInterface={aiState} />
        </XR>
      </Canvas>
    </div>
  );
}
