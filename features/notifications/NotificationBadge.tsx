import { Html } from "@react-three/drei";
import { useEffect, useState } from "react";

import { Check, AlertTriangle, Info } from "lucide-react";

type BadgeVariant = "success" | "error" | "neutral";

interface BadgeProps {
  /**
   * The text message to display inside the notification.
   */
  label: string;

  /**
   * Visual style variant. Affects border color, background, and icon.
   * Defaults to 'success'.
   */
  variant?: BadgeVariant;
}

/**
 * 3D Component for displaying ephemeral notifications (Toasts) in the AR scene.
 *
 * It renders a floating "Badge" that animates into view.
 * Useful for confirming actions like "Timer Started" or "Item Added".
 *
 * @param label - The message text.
 * @param variant - Style preset ('success', 'error', 'neutral').
 */
export function NotificationBadge({ label, variant = "success" }: BadgeProps) {
  const [animate, setAnimate] = useState(false);

  // Trigger the slide-in animation shortly after mounting
  useEffect(() => {
    requestAnimationFrame(() => setAnimate(true));
  }, []);

  const styles = {
    success: {
      border: "border-green-500/30",
      bg: "bg-gray-900/90",
      text: "text-green-400",
      icon: Check,
    },
    error: {
      border: "border-red-500/30",
      bg: "bg-gray-900/90",
      text: "text-red-400",
      icon: AlertTriangle,
    },
    neutral: {
      border: "border-white/10",
      bg: "bg-gray-900/90",
      text: "text-white",
      icon: Info,
    },
  };
  const s = styles[variant];
  const IconComponent = s.icon;

  return (
    // Fixed high position (Top Center of the field of view)
    <group position={[0, 4, -1]}>
      <Html transform occlude center scale={0.2}>
        <div
          className={`
            flex items-center gap-4 px-8 py-4 rounded-full border backdrop-blur-xl shadow-2xl transition-all duration-500 ease-out
            ${s.bg} ${s.border}
            ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          {/* Icon Container */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-black bg-white/5 border border-white/5 ${s.text}`}
          >
            <IconComponent className="w-5 h-5 stroke-[3]" />
          </div>

          {/* Label Text */}
          <span className="text-white font-bold text-lg tracking-wide uppercase">
            {label}
          </span>
        </div>
      </Html>
    </group>
  );
}
