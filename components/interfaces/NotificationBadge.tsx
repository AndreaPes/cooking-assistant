import { Html } from "@react-three/drei";
import { useEffect, useState } from "react";

// 1. Define the supported styles
type BadgeVariant = "success" | "error" | "neutral";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function NotificationBadge({ label, variant = "success" }: BadgeProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setAnimate(true));
  }, []);

  const styles = {
    success: {
      borderColor: "border-green-500/50",
      shadow: "shadow-[0_0_30px_rgba(34,197,94,0.3)]",
      iconBg: "bg-green-500",
      iconSymbol: "✓",
    },
    error: {
      borderColor: "border-red-500/50",
      shadow: "shadow-[0_0_30px_rgba(239,68,68,0.3)]",
      iconBg: "bg-red-500",
      iconSymbol: "✕",
    },
    neutral: {
      borderColor: "border-blue-500/50",
      shadow: "shadow-[0_0_30px_rgba(59,130,246,0.3)]",
      iconBg: "bg-blue-500",
      iconSymbol: "i",
    },
  };

  const currentStyle = styles[variant];

  return (
    <group position={[0, 0.5, -1.5]}>
      <Html transform occlude center>
        <div
          className={`
            flex items-center gap-3 px-6 py-3 rounded-full border transition-all duration-500 ease-out
            bg-black/60 backdrop-blur-md ${currentStyle.borderColor} ${currentStyle.shadow}
            ${animate ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-90"}
          `}
        >
          {/* Icon Circle */}
          <div
            className={`w-6 h-6 rounded-full ${currentStyle.iconBg} flex items-center justify-center text-black text-sm font-bold`}
          >
            {currentStyle.iconSymbol}
          </div>

          {/* Text */}
          <span className="text-white font-bold text-lg tracking-wide whitespace-nowrap">
            {label}
          </span>
        </div>
      </Html>
    </group>
  );
}
