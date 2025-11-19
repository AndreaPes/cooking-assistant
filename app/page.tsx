'use client';

import dynamic from 'next/dynamic';

// 1. Dynamically import the ARScene with SSR disabled
// This prevents "window is not defined" errors
const ARScene = dynamic(() => import('@/components/ARScene'), {
    ssr: false,
    loading: () => (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
            <p>Loading 3D Engine...</p>
        </div>
    )
});

export default function Home() {
    return (
        <main className="h-screen w-screen bg-gray-900">
            {/* 2. Render the Scene taking up the full screen */}
            <ARScene />
        </main>
    );
}