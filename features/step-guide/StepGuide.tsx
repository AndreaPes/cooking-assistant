import { Html } from "@react-three/drei";
import { AtomicStep } from "@/types/interfaces";
import { AlertTriangle } from "lucide-react";

interface StepGuideProps {
  /**
   * The current atomic step object containing instructions, safety warnings, and timer data.
   */
  step: AtomicStep;

  /**
   * The zero-based index of the current step in the recipe sequence.
   */
  stepIndex: number;

  /**
   * The total number of steps in the active recipe.
   */
  totalSteps: number;
}

/**
 * 3D Component that renders the active cooking instruction (HUD style).
 *
 * Designed to be the primary focus during the cooking session.
 * It displays:
 * 1. Progress Counter (Step X / Y).
 * 2. Safety Warnings (if any).
 * 3. Big Action Verbs & Targets (e.g., "CHOP ONION") for quick readability.
 * 4. Detailed instructions for clarification.
 *
 * @param step - The current step data.
 * @param stepIndex - Current index.
 * @param totalSteps - Total count.
 */
export function StepGuide({ step, stepIndex, totalSteps }: StepGuideProps) {
  if (!step) return null;

  const current = (stepIndex + 1).toString().padStart(2, "0");
  const total = totalSteps.toString().padStart(2, "0");

  return (
    // Position: Center, slightly lower than eye level to avoid blocking the view
    <group position={[-3, 3, -1.5]}>
      {/* SCALE 0.4: Optimal size for readability without overwhelming the field of view */}
      <Html transform occlude center scale={0.4}>
        <div className="flex flex-col items-center select-none animate-in fade-in zoom-in duration-300 w-[500px]">
          {/* 1. TOP BADGE: Step Counter */}
          <div className="mb-4 px-4 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/20 shadow-lg">
            <span className="text-orange-400 font-mono text-sm font-bold tracking-widest">
              STEP {current} <span className="text-white/40">/</span> {total}
            </span>
          </div>

          {/* 2. SAFETY WARNING ALERT */}
          {step.warning && (
            <div className="mb-6 flex items-center gap-4 pl-2 pr-6 py-2 bg-red-500/10 backdrop-blur-2xl border border-red-500/20 rounded-full shadow-lg">
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center shadow-inner text-white">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>

              <p className="font-bold text-white uppercase tracking-wider text-sm drop-shadow-md">
                {step.warning}
              </p>
            </div>
          )}

          {/* 3. MAIN ACTION WIDGET */}
          {/* Large typography for "At-a-glance" reading */}
          <div
            className="flex flex-row items-center justify-center gap-8 px-10 py-8 rounded-[2rem]
                       bg-gray-900/60 backdrop-blur-xl border border-white/10 shadow-2xl w-full"
          >
            {/* Left: Action Verb (e.g., CHOP) */}
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

            {/* Right: Target Object (e.g., ONION) */}
            <div className="flex flex-col items-start max-w-[220px]">
              <span className="text-[11px] text-white/40 font-bold tracking-[0.2em] uppercase mb-1">
                TARGET
              </span>
              <h2 className="text-4xl font-bold text-white uppercase leading-none drop-shadow-sm break-words text-left">
                {step.targetObject}
              </h2>
            </div>
          </div>

          {/* 4. DETAILS ROW */}
          {/* Detailed text instructions for clarification */}
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
