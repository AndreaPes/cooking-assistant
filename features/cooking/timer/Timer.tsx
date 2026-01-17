import { Html } from "@react-three/drei";
import { useEffect, useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Vector3, Quaternion } from "three";
import { useCookingState } from "@/state/cookingState";
import { TimerItem } from "@/state/slices/timerSlice";

interface TimerProps extends TimerItem {
  stackIndex?: number;
}

export function Timer({
  id,
  seconds,
  label = "Timer",
  status,
  stackIndex = 0,
}: TimerProps) {
  // --- Local State ---
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [finished, setFinished] = useState(false);

  // --- Refs ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevSecondsRef = useRef(seconds);
  const rootRef = useRef<Group>(null);

  const tmpPos = useRef(new Vector3()).current;
  const tmpQuat = useRef(new Quaternion()).current;

  const { removeTimerById } = useCookingState();

  // --- Audio ---
  const playAlarmSound = () => {
    if (audioRef.current) return; // 🔴 prevent double play
    const alarm = new Audio(
      "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
    );
    alarm.loop = true;
    alarm.volume = 0.5;
    alarm.play().catch(() => {});
    audioRef.current = alarm;
  };

  const stopAlarm = () => {
    audioRef.current?.pause();
    audioRef.current = null;
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
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

  // --- Sync seconds updates ---
  useEffect(() => {
    const delta = seconds - prevSecondsRef.current;
    if (delta !== 0) {
      setTimeLeft((t) => Math.max(t + delta, 0));
      prevSecondsRef.current = seconds;
    }
  }, [seconds]);

  // --- Countdown ---
  useEffect(() => {
    if (status !== "running") return;
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, timeLeft]);

  // --- Finish transition (ONE SHOT) ---
  useEffect(() => {
    if (timeLeft !== 0 || finished || status !== "running") return;

    setFinished(true);
    playAlarmSound();

    const vanish = setTimeout(() => {
      stopAlarm();
      removeTimerById(id);
    }, 30000);

    return () => clearTimeout(vanish);
  }, [timeLeft, finished, status, id, removeTimerById]);

  // --- Cleanup ---
  useEffect(() => stopAlarm, []);

  // --- HUD offset ---
  const xOffset = 0.55;
  const yOffset = 0.25 - stackIndex * 0.18;
  const zOffset = -1;

  return (
    <group ref={rootRef} frustumCulled={false} renderOrder={800}>
      <group position={[xOffset, yOffset, zOffset]}>
        <Html transform occlude scale={0.4}>
          <div
            className={`
              w-48 p-4 rounded-2xl flex flex-col items-center select-none border backdrop-blur-md shadow-lg
              ${
                finished
                  ? "bg-red-500/40 border-red-500 animate-pulse"
                  : "bg-white/10 border-white/20"
              }
            `}
          >
            <span className="uppercase tracking-wider text-[10px] font-bold mb-1 text-white/60">
              {finished ? "TIME'S UP!" : label}
            </span>

            <div className="text-4xl font-mono text-white">
              {formatTime(timeLeft)}
            </div>

            <div className="h-1 w-full bg-black/20 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-white/80 transition-all duration-1000"
                style={{
                  width: `${Math.max(0, (timeLeft / seconds) * 100)}%`,
                }}
              />
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}
