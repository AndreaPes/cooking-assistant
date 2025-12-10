"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// 1. Dynamically import the ARScene
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

export default function Home() {
  return (
    <main className="h-screen w-screen relative overflow-hidden">
      <ARScene />
    </main>
  );
}
