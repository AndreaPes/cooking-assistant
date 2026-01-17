import { Html } from "@react-three/drei";
import { useEffect, useState, useRef } from "react";
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
 * LOGIC: UNCHANGED
 * XR ADAPTATION:
 * - Head-locked (camera-space)
 * - Quest-safe (ArrayCamera)
 * - Right-side HUD stack
 * - Frustum culling disabled
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
  const isFinished = status === "running" && timeLeft === 0;

  // --- Refs ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevSecondsRef = useRef(seconds);
  const rootRef = useRef<Group>(null);

  // --- Temp objects (avoid allocations) ---
  const tmpPos = useRef(new Vector3()).current;
  const tmpQuat = useRef(new Quaternion()).current;

  // --- Global Actions ---
  const { removeTimerById } = useCookingState();

  // --- Audio Helpers ---
  const playAlarmSound = () => {
    const alarmSound = new Audio(
      "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
    );
    alarmSound.loop = true;
    alarmSound.volume = 0.5;
    alarmSound.play().catch((e) => console.error("Audio autoplay blocked:", e));
    audioRef.current = alarmSound;
  };

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

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

  // --- Effects ---

  // Sync when seconds change
  useEffect(() => {
    const delta = seconds - prevSecondsRef.current;

    if (delta !== 0) {
      setTimeLeft((current) => Math.max(current + delta, 0));
      prevSecondsRef.current = seconds;
    }

    if (status !== "running") {
      stopAlarm();
    }
  }, [seconds, status]);

  // Countdown interval
  useEffect(() => {
    if (status !== "running") return;

    const interval = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  // Alarm + auto remove
  useEffect(() => {
    if (!isFinished) return;

    playAlarmSound();

    const vanishTimer = setTimeout(() => {
      stopAlarm();
      removeTimerById(id);
    }, 30000);

    return () => clearTimeout(vanishTimer);
  }, [isFinished, id, removeTimerById]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAlarm();
  }, []);

  // --- Camera-local HUD offset ---
  const xOffset = 0.55;
  const yOffset = 0.25 - stackIndex * 0.18;
  const zOffset = -1;

  // --- Render ---
  return (
    <group ref={rootRef} frustumCulled={false} renderOrder={800}>
      <group position={[xOffset, yOffset, zOffset]}>
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
                    : `${Math.min(100, (timeLeft / seconds) * 100)}%`,
                }}
              />
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}
