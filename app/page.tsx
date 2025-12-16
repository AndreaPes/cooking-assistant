"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

/**
 * Dynamically imports the AR Scene with Server-Side Rendering (SSR) disabled.
 * This is crucial because WebXR and Three.js rely on the 'window' object,
 * which is not available during server rendering.
 */
const ARScene = dynamic(() => import("@/components/ARScene"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900 text-white gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      <p className="text-sm font-mono text-white/50 tracking-widest uppercase">
        Initializing AR System...
      </p>
    </div>
  ),
});

/**
 * The main entry point for the application.
 * It renders the full-screen AR experience.
 *
 * Note: The 'overflow-hidden' class on the container ensures that
 * 3D gestures don't accidentally scroll the webpage on mobile devices.
 */
export default function Home() {
  return (
    <main className="h-screen w-screen relative overflow-hidden">
      <ARScene />
    </main>
  );
}
