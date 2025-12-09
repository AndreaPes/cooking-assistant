import { Html } from "@react-three/drei";
import { useEffect, useState } from "react";

interface InfoPanelProps {
  text: string;
  onClose?: () => void;
}

export function InfoPanel({ text, onClose }: InfoPanelProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose && onClose(), 500);
    }, 8000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <group position={[0, 1, -1.5]}>
      <Html transform occlude center scale={0.4}>
        <div
          className={`
            w-[600px] p-8 rounded-[2rem] border backdrop-blur-xl shadow-2xl flex flex-col gap-4 transition-all duration-500 ease-out
            bg-gray-900/90 border-white/10
            ${visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"}
          `}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50 text-blue-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-blue-400 uppercase">
              ASSISTANT
            </span>
          </div>

          {/* Content */}
          <p className="text-xl font-medium text-white leading-relaxed">
            {text}
          </p>
        </div>
      </Html>
    </group>
  );
}
