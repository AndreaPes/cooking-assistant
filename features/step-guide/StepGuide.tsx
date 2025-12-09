import { Html } from "@react-three/drei";
import { AtomicStep } from "@/types/interfaces";

interface StepGuideProps {
  step: AtomicStep;
  stepIndex: number;
  totalSteps: number;
}

export function StepGuide({ step, stepIndex, totalSteps }: StepGuideProps) {
  if (!step) return null;

  const current = (stepIndex + 1).toString().padStart(2, "0");
  const total = totalSteps.toString().padStart(2, "0");

  return (
    // Position: Center, slightly lower than before to not block eyes
    <group position={[-3, 3, -1.5]}>
      {/* SCALE 0.3: Makes it small and crisp (HUD style) */}
      <Html transform occlude center scale={0.4}>
        <div className="flex flex-col items-center select-none animate-in fade-in zoom-in duration-300 w-[500px]">
          {/* 1. TOP BADGE: Counter */}
          <div className="mb-4 px-4 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/20 shadow-lg">
            <span className="text-orange-400 font-mono text-sm font-bold tracking-widest">
              STEP {current} <span className="text-white/40">/</span> {total}
            </span>
          </div>

          {/* 2. WARNING ALERT */}
          {step.warning && (
            <div className="mb-6 flex items-center gap-4 pl-2 pr-6 py-2 bg-red-500/10 backdrop-blur-2xl border border-red-500/20 rounded-full shadow-lg">
              {/* Cerchio icona solido */}
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center shadow-inner text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>

              {/* Testo */}
              <p className="font-bold text-white uppercase tracking-wider text-sm drop-shadow-md">
                {step.warning}
              </p>
            </div>
          )}

          {/* 3. MAIN ACTION WIDGET */}
          <div
            className="flex flex-row items-center justify-center gap-8 px-10 py-8 rounded-[2rem]
                       bg-gray-900/60 backdrop-blur-xl border border-white/10 shadow-2xl w-full"
          >
            {/* Left: Action Verb */}
            <div className="flex flex-col items-center">
              <span className="text-[11px] text-white/40 font-bold tracking-[0.2em] uppercase mb-1">
                ACTION
              </span>
              <h1 className="text-5xl font-black text-orange-500 tracking-tighter uppercase leading-none drop-shadow-sm">
                {step.actionVerb}
              </h1>
            </div>

            {/* Vertical Divider */}
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

            {/* Right: Target Object */}
            <div className="flex flex-col items-start max-w-[220px]">
              <span className="text-[11px] text-white/40 font-bold tracking-[0.2em] uppercase mb-1">
                TARGET
              </span>
              <h2 className="text-4xl font-bold text-white uppercase leading-none drop-shadow-sm break-words text-left">
                {step.targetObject}
              </h2>
            </div>
          </div>

          {/* 4. DETAILS ROW (Senza Timer Widget, solo testo) */}
          {step.details && (
            <div className="mt-4 w-full flex justify-center">
              <div className="px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 max-w-[90%]">
                <p className="text-white/90 text-sm font-medium text-center leading-relaxed">
                  {step.details}
                </p>
              </div>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}
