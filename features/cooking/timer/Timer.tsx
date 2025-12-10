import { Html } from "@react-three/drei";
import { useEffect, useState, useRef } from "react";
import { useCookingState } from "@/state/cookingState";
import { TimerItem } from "@/state/slices/timerSlice";

interface TimerProps extends TimerItem {
  /**
   * The 3D coordinates [x, y, z] to position the timer in the scene.
   * If not provided, it defaults to a right-aligned stack position.
   */
  customPosition?: [number, number, number];
}

/**
 * 3D Component representing a single active timer.
 *
 * It manages its own internal countdown state to decouple the UI refresh rate
 * from the global store, improving performance.
 *
 * Features:
 * - **Visuals**: Glass morphism UI that pulses red when finished.
 * - **Audio**: Plays a looped alarm sound upon completion.
 * - **Self-Destruct**: Automatically removes itself from the global store after 30 seconds of ringing to clear the HUD.
 *
 * @param id - Unique timer ID.
 * @param seconds - Initial duration in seconds.
 * @param label - Name of the timer (e.g., "Pasta").
 * @param status - Current state ('running', 'paused', 'idle').
 * @param customPosition - Vector3 position.
 */
export function Timer({
  id,
  seconds,
  label = "Timer",
  customPosition,
  status,
}: TimerProps) {
  // --- Local State ---
  // Managed locally to allow 1-second interval updates without re-rendering the entire app tree.
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isFinished, setIsFinished] = useState(false);

  // --- Refs ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevSecondsRef = useRef(seconds);

  // --- Global Actions ---
  const { removeTimerById } = useCookingState();

  // --- Audio Helpers ---

  /**
   * Initializes and plays the alarm sound.
   * Sets loop=true to ensure continuous ringing until user interaction or timeout.
   */
  const playAlarmSound = () => {
    const alarmSound = new Audio(
      "https://actions.google.com/sounds/v1/alarms/beep_short.ogg",
    );
    alarmSound.loop = true;
    alarmSound.volume = 0.5;
    alarmSound.play().catch((e) => console.error("Audio autoplay blocked:", e));
    audioRef.current = alarmSound;
  };

  /**
   * Stops the currently playing audio and cleans up the reference.
   * Safe to call even if no audio is playing.
   */
  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  /**
   * Formats a seconds integer into a standard MM:SS string.
   * Example: 65 -> "1:05"
   */
  const formatTime = (s: number) => {
    const minutes = Math.floor(s / 60);
    const secs = s % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Default Anchor: Right side of the field of view
  const positionVector = customPosition || [5, 0, -2];

  // --- Effects ---

  /**
   * SYNC EFFECT:
   * Watches for changes in the `seconds` prop (e.g., AI updates the duration).
   * Resets local state and stops any active alarms.
   */
  useEffect(() => {
    const delta = seconds - prevSecondsRef.current;

    if (delta !== 0) {
      console.log(`Adjusting Timer ${label}: ${delta > 0 ? "+" : ""}${delta}s`);
      setTimeLeft((current) => Math.max(current + delta, 0));
      prevSecondsRef.current = seconds;
    }

    if (status !== "finished") {
      setIsFinished(false);
      stopAlarm();
    }
  }, [seconds, label, status]);

  /**
   * COUNTDOWN EFFECT:
   * The core ticker. Decrements `timeLeft` every second if status is 'running'.
   * Triggers the finish state when 0 is reached.
   */
  useEffect(() => {
    if (status === "paused" || status === "idle") return;

    if (status === "running" && timeLeft > 0) {
      const interval = setInterval(
        () => setTimeLeft((t) => Math.max(0, t - 1)),
        1000,
      );
      return () => clearInterval(interval);
    } else if (status === "running" && timeLeft <= 0 && !isFinished) {
      setIsFinished(true);
      playAlarmSound();
    }
  }, [timeLeft, status, isFinished]);

  /**
   * CLEANUP EFFECT (Self-Destruct):
   * If the timer is finished (ringing), this sets a timeout to automatically
   * delete it from the global store after 30 seconds.
   * This prevents "ghost timers" from cluttering the AR view.
   */
  useEffect(() => {
    if (isFinished) {
      const vanishTimer = setTimeout(() => {
        console.log(`⏰ Auto-removing timer ${id} from store...`);
        stopAlarm();
        removeTimerById(id);
      }, 30000);

      return () => clearTimeout(vanishTimer);
    }
  }, [isFinished, id, removeTimerById]);

  /**
   * UNMOUNT EFFECT:
   * Ensures audio is stopped if the component is removed from the DOM
   * (e.g., user manually deletes the timer).
   */
  useEffect(() => {
    return () => stopAlarm();
  }, []);

  // --- Render ---

  return (
    <group position={positionVector}>
      <Html transform occlude scale={0.4}>
        <div
          className={`
            w-48 p-4 rounded-2xl flex flex-col items-center select-none border backdrop-blur-md shadow-lg transition-all duration-500 
            ${status === "idle" ? "opacity-50 grayscale" : ""}
            ${status === "paused" ? "border-yellow-400 bg-yellow-400/10" : ""} 
            ${
              isFinished
                ? "bg-red-500/40 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.6)] animate-pulse"
                : "bg-white/10 border-white/20 shadow-sm"
            }
        `}
        >
          {/* Label Header */}
          <span className="uppercase tracking-wider text-[10px] font-bold mb-1 text-white/60">
            {isFinished ? "TIME'S UP!" : label}{" "}
            {status === "paused" && "(PAUSED)"}
          </span>

          {/* Digital Clock */}
          <div className="text-4xl font-mono font-medium text-white tracking-tight drop-shadow-sm">
            {isFinished ? "0:00" : formatTime(timeLeft)}
          </div>

          {/* Progress Bar Visual */}
          <div className="h-1 w-full bg-black/20 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                isFinished
                  ? "bg-red-500 w-full"
                  : status === "paused"
                    ? "bg-yellow-400"
                    : "bg-white/80"
              }`}
              style={{
                width: isFinished
                  ? "100%"
                  : `${Math.min(100, (timeLeft / seconds) * 100)}%`,
              }}
            />
          </div>
        </div>
      </Html>
    </group>
  );
}
