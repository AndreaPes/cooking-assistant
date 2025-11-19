import { Html } from '@react-three/drei';

interface InstructionProps {
    text: string;
    stepNumber: number;
}

export function InstructionCard({ text, stepNumber }: InstructionProps) {
    return (
        // <Html> lets us use standard Tailwind HTML inside the 3D scene!
        <Html
            transform // Makes it move with 3D space, not stuck to screen
            position={[0, 1.5, -1]} // 1.5m up, 1m in front of user
            occlude // Hides it if behind other 3D objects
        >
            <div className="w-80 p-6 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-orange-500 flex flex-col gap-3 select-none">
                <div className="flex items-center justify-between border-b pb-2 border-gray-200">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
            Current Step
          </span>
                    <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">
            #{stepNumber}
          </span>
                </div>

                <p className="text-2xl font-bold text-gray-800 leading-snug">
                    {text}
                </p>

                <div className="flex gap-2 mt-2">
           <span className="text-[10px] text-gray-500">
             Say "Next" when done
           </span>
                </div>
            </div>
        </Html>
    );
}