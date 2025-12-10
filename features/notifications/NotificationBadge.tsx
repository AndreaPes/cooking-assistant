import { Html } from "@react-three/drei";
import { useEffect, useState } from "react";

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
      border: "border-green-500/30",
      bg: "bg-gray-900/90",
      text: "text-green-400",
      icon: "✓",
    },
    error: {
      border: "border-red-500/30",
      bg: "bg-gray-900/90",
      text: "text-red-400",
      icon: "!",
    },
    neutral: {
      border: "border-white/10",
      bg: "bg-gray-900/90",
      text: "text-white",
      icon: "i",
    },
  };
  const s = styles[variant];

  return (
    <group position={[0, 4, -1]}>
      <Html transform occlude center scale={0.2}>
        <div
          className={`
            flex items-center gap-4 px-8 py-4 rounded-full border backdrop-blur-xl shadow-2xl transition-all duration-500 ease-out
            ${s.bg} ${s.border}
            ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-black bg-white/5 border border-white/5 ${s.text}`}
          >
            {s.icon}
          </div>
          <span className="text-white font-bold text-lg tracking-wide uppercase">
            {label}
          </span>
        </div>
      </Html>
    </group>
  );
}
