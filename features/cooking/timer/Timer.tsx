import { Html } from "@react-three/drei";
import { useEffect, useState, useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Vector3, Quaternion } from "three";
import { useCookingState } from "@/state/cookingState";
import { TimerItem } from "@/state/slices/timerSlice";

interface TimerProps extends TimerItem {
  /**
   * Vertical index used for stacking multiple timers in the HUD.
   * If not provided, defaults to 0 (top).
   */
  stackIndex?: number;
}

/**
 * 3D Component representing a single active timer.
 *
 * Fixes:
 * - Removed Html occlude (can hide HUD in XR unexpectedly).
 * - Alarm is now single-instance + guaranteed cleanup (StrictMode-safe).
 * - Countdown uses a stable interval ref (no re-creating per tick).
 */
export function Timer({
  id,
  seconds,
  label = "Timer",
  status,
  stackIndex = 0,
}: TimerProps) {
  // --- Local State ---
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isFinished, setIsFinished] = useState(false);

  // --- Refs ---
  const rootRef = useRef<Group>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alarmStartedRef = useRef(false);

  const intervalRef = useRef<number | null>(null);
  const vanishTimeoutRef = useRef<number | null>(null);

  const prevSecondsRef = useRef(seconds);

  // --- Temp objects (avoid allocations) ---
  const tmpPos = useRef(new Vector3()).current;
  const tmpQuat = useRef(new Quaternion()).current;

  // --- Global Actions ---
  const { removeTimerById } = useCookingState();

  const clearTickInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stopAlarm = useCallback(() => {
    alarmStartedRef.current = false;

    if (vanishTimeoutRef.current !== null) {
      window.clearTimeout(vanishTimeoutRef.current);
      vanishTimeoutRef.current = null;
    }

    const a = audioRef.current;
    if (a) {
      try {
        a.pause();
        a.currentTime = 0;
      } catch {
        // ignore
      }
      a.loop = false;
    }
    audioRef.current = null;
  }, []);

  const playAlarmSound = useCallback(() => {
    // Prevent double-start (React StrictMode / remounts / repeated effects)
    if (alarmStartedRef.current) return;
    alarmStartedRef.current = true;

    // Stop any previous/ghost instance
    const old = audioRef.current;
    if (old) {
      try {
        old.pause();
        old.currentTime = 0;
      } catch {
        // ignore
      }
    }

    const a = new Audio(
      "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
    );
    a.loop = true;
    a.volume = 0.5;
    a.currentTime = 0;
    audioRef.current = a;

    a.play().catch((e) => console.error("Audio autoplay blocked:", e));
  }, []);

  const formatTime = (s: number) => {
    const minutes = Math.floor(s / 60);
    const secs = s % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // --- XR Head Lock ---
  useFrame((state) => {
    const camAny: any = state.camera;
    const cam = camAny.isArrayCamera ? camAny.cameras[0] : camAny;

    if (!rootRef.current) return;

    cam.getWorldPosition(tmpPos);
    cam.getWorldQuaternion(tmpQuat);

    rootRef.current.position.copy(tmpPos);
    rootRef.current.quaternion.copy(tmpQuat);
    rootRef.current.frustumCulled = false;
  });

  // Sync local timeLeft if prop seconds changes (add/subtract time)
  useEffect(() => {
    const delta = seconds - prevSecondsRef.current;
    if (delta !== 0) {
      setTimeLeft((current) => Math.max(current + delta, 0));
      prevSecondsRef.current = seconds;
    }
  }, [seconds]);

  // React to status changes
  useEffect(() => {
    // If the timer is not finished anymore (e.g. restarted), kill alarm + reset finish
    if (status !== "finished") {
      setIsFinished(false);
      stopAlarm();
    }

    if (status === "paused" || status === "idle") {
      clearTickInterval();
    }
  }, [status, stopAlarm, clearTickInterval]);

  // Countdown tick when running
  useEffect(() => {
    if (status !== "running" || isFinished) {
      clearTickInterval();
      return;
    }

    clearTickInterval();

    intervalRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearTickInterval();
          setIsFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearTickInterval();
  }, [status, isFinished, clearTickInterval]);

  // When finished: start alarm + auto-remove (and stop) after 30s
  useEffect(() => {
    if (!isFinished) return;

    playAlarmSound();

    vanishTimeoutRef.current = window.setTimeout(() => {
      stopAlarm();
      removeTimerById(id);
    }, 5000);

    return () => {
      if (vanishTimeoutRef.current !== null) {
        window.clearTimeout(vanishTimeoutRef.current);
        vanishTimeoutRef.current = null;
      }
    };
  }, [isFinished, id, playAlarmSound, stopAlarm, removeTimerById]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTickInterval();
      stopAlarm();
    };
  }, [clearTickInterval, stopAlarm]);

  // --- Camera-local HUD offset ---
  const xOffset = 0.55;
  const yOffset = 0.25 - stackIndex * 0.18;
  const zOffset = -1;

  // --- Render ---
  return (
    <group ref={rootRef} frustumCulled={false} renderOrder={800}>
      <group position={[xOffset, yOffset, zOffset]}>
        {/* IMPORTANT: remove occlude for XR HUD stability */}
        <Html transform scale={0.4}>
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
            <span className="uppercase tracking-wider text-[10px] font-bold mb-1 text-white/60">
              {isFinished ? "TIME'S UP!" : label}{" "}
              {status === "paused" && "(PAUSED)"}
            </span>

            <div className="text-4xl font-mono font-medium text-white tracking-tight drop-shadow-sm">
              {isFinished ? "0:00" : formatTime(timeLeft)}
            </div>

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
                    : seconds > 0
                      ? `${Math.min(100, (timeLeft / seconds) * 100)}%`
                      : "0%",
                }}
              />
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}
