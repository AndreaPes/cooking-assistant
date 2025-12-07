import { Html } from "@react-three/drei";
import { useEffect, useState, useRef } from "react";
import { useCookingState } from "@/state/cookingState";
import { TimerItem } from "@/state/slices/timerSlice";

interface TimerProps extends TimerItem {
  customPosition?: [number, number, number];
}

export function Timer({
  id,
  seconds,
  label = "Timer",
  customPosition,
  status,
}: TimerProps) {
  // --- State ---
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isFinished, setIsFinished] = useState(false);

  // --- Refs & Hooks ---
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // We only need the specific delete function by ID to prevent "Ghost Gaps"
  const { removeTimerById } = useCookingState();

  // --- Helpers ---

  /**
   * Plays the alarm sound in a loop.
   * Uses a standard Google sound asset.
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
   * Stops the audio immediately and clears the ref.
   */
  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  /**
   * Formats seconds into MM:SS
   */
  const formatTime = (s: number) => {
    const minutes = Math.floor(s / 60);
    const secs = s % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Default to right-side stacking if no position provided
  const positionVector = customPosition || [5, 0, -2];

  // --- Effects ---

  /**
   * Reset Logic:
   * If the AI updates the seconds (e.g., "Change timer to 5 mins"),
   * this resets the countdown state.
   */
  useEffect(() => {
    console.log("🔄 Timer Updated:", seconds);
    setTimeLeft(seconds);
    setIsFinished(false);
    stopAlarm(); // Stop any ringing alarms if reset
  }, [seconds]);

  /**
   * Core Countdown Loop:
   * Decrements time every second. Triggers alarm at 0.
   */
  useEffect(() => {
    if (status === "running" && timeLeft > 0) {
      const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (status === "running" && timeLeft <= 0) {
      setIsFinished(true);
      playAlarmSound();
    }
  }, [timeLeft, status]);

  /**
   * Self-Destruct Sequence:
   * Automatically removes the timer from the Global Store after 30 seconds of ringing.
   * This fixes the "Ghost Space" bug because the store updates the list length.
   */
  useEffect(() => {
    if (isFinished) {
      const vanishTimer = setTimeout(() => {
        console.log(`⏰ Auto-removing timer ${id} from store...`);
        stopAlarm();
        removeTimerById(id); // <--- This triggers the stack realignment
      }, 30000);

      return () => clearTimeout(vanishTimer);
    }
  }, [isFinished, id, removeTimerById]);

  /**
   * Cleanup:
   * Ensures audio stops if the user cancels the timer via voice.
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
            w-48 p-4 rounded-2xl flex flex-col items-center select-none border backdrop-blur-md shadow-lg transition-all duration-500 ${status === "idle" ? "opacity-50 grayscale" : ""}
            ${
              isFinished
                ? "bg-red-500/40 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.6)] animate-pulse"
                : "bg-white/10 border-white/20 shadow-sm"
            }
        `}
        >
          {/* Timer Label */}
          <span
            className={`uppercase tracking-wider text-[10px] font-bold mb-1 ${
              isFinished ? "text-white" : "text-white/60"
            }`}
          >
            {isFinished ? "TIME'S UP!" : label}
          </span>

          {/* Digital Clock Display */}
          <div className="text-4xl font-mono font-medium text-white tracking-tight drop-shadow-sm">
            {isFinished ? "0:00" : formatTime(timeLeft)}
          </div>

          {/* Progress Bar */}
          <div className="h-1 w-full bg-black/20 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                isFinished ? "bg-red-500 w-full" : "bg-white/80"
              }`}
              style={{
                width: isFinished ? "100%" : `${(timeLeft / seconds) * 100}%`,
              }}
            />
          </div>
        </div>
      </Html>
    </group>
  );
}
