import { Html } from "@react-three/drei";
import { Mic, Camera, Loader2 } from "lucide-react";
import { AssistantStatus } from "@/state/assistantState";

interface ControlPanelProps {
  /**
   * Current status of the AI Assistant (Idle, Listening, Processing).
   * Determines the color and animation of the microphone button.
   */
  status: AssistantStatus;

  /**
   * Whether the background webcam feed is currently active.
   */
  isCameraMode: boolean;

  /**
   * Toggles the webcam feed on/off.
   */
  onToggleCamera: () => void;

  /**
   * Activates the voice input.
   */
  onMicClick: () => void;
}

/**
 * 3D Control Panel (HUD)
 * ----------------------
 * Renders the primary controls (Microphone and Camera Toggle) as floating 3D objects
 * within the AR scene. Positioned dashboard-style relative to the user.
 */
export function ControlPanel({
  status,
  isCameraMode,
  onToggleCamera,
  onMicClick,
}: ControlPanelProps) {
  /**
   * Determines the visual style of the microphone button based on AI status.
   */
  const getMicConfig = () => {
    switch (status) {
      case AssistantStatus.LISTENING:
        return {
          style:
            "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.6)] scale-110",
          icon: <Mic className="w-8 h-8 animate-pulse" />,
        };
      case AssistantStatus.PROCESSING:
        return {
          style:
            "bg-yellow-400 text-black shadow-[0_0_30px_rgba(250,204,21,0.6)]",
          icon: <Loader2 className="w-8 h-8 animate-spin" />,
        };
      default: // IDLE
        return {
          style:
            "bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-md",
          icon: <Mic className="w-8 h-8" />,
        };
    }
  };

  const micConfig = getMicConfig();

  return (
    // Position: Lower center (Dashboard view), tilted slightly upwards
    <group position={[4, 5, -4]} rotation={[0, -0.5, 0]}>
      <Html transform occlude center scale={0.3}>
        <div className="flex items-center gap-6 p-4 rounded-full bg-gray-900/80 backdrop-blur-xl border border-white/10 shadow-2xl">
          {/* CAMERA TOGGLE SWITCH */}
          <button
            onClick={onToggleCamera}
            className={`
              relative w-16 h-9 rounded-full p-1 transition-colors duration-300 ease-in-out shadow-lg flex items-center
              ${isCameraMode ? "bg-green-500" : "bg-gray-600/80 backdrop-blur"}
            `}
            aria-label={isCameraMode ? "Turn Camera Off" : "Turn Camera On"}
          >
            {/* Knob with Icon */}
            <div
              className={`
                w-7 h-7 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-[cubic-bezier(0.4,0.0,0.2,1)] flex items-center justify-center
                ${isCameraMode ? "translate-x-7" : "translate-x-0"}
              `}
            >
              <Camera
                className={`w-4 h-4 ${isCameraMode ? "text-green-600" : "text-gray-500"}`}
              />
            </div>
          </button>

          {/* VERTICAL DIVIDER */}
          <div className="w-px h-10 bg-white/10" />

          {/* MICROPHONE BUTTON */}
          <button
            onClick={onMicClick}
            className={`
              w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl
              ${micConfig.style}
            `}
            aria-label="Activate Voice Assistant"
          >
            {micConfig.icon}
          </button>
        </div>
      </Html>
    </group>
  );
}
