import { useEffect, useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Vector3, Quaternion } from "three";
import { RoundedBox, Text } from "@react-three/drei";
import { useCookingState } from "@/state/cookingState";
import { TimerItem } from "@/state/slices/timerSlice";

interface TimerProps extends TimerItem {
  stackIndex?: number;
}

export function Timer({
  id,
  seconds,
  totalSeconds,
  label = "Timer",
  status,
  stackIndex = 0,
}: TimerProps) {
  // --- Local State ---
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isFinished, setIsFinished] = useState(false);

  // --- Refs ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevSecondsRef = useRef(seconds);
  const rootRef = useRef<Group>(null);

  const tmpPos = useRef(new Vector3()).current;
  const tmpQuat = useRef(new Quaternion()).current;

  const { removeTimerById } = useCookingState();

  // --- Audio ---
  const playAlarmSound = () => {
    if (audioRef.current) return;
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

  // --- Sync seconds updates ---
  useEffect(() => {
    const delta = seconds - prevSecondsRef.current;

    if (delta !== 0) {
      console.log(`Adjusting Timer ${label}: ${delta > 0 ? "+" : ""}${delta}s`);
      setTimeLeft((current) => Math.max(current + delta, 0));
      prevSecondsRef.current = seconds;
    }

    if (status === "running") {
      setIsFinished(false);
      stopAlarm();
    }
  }, [seconds, label, status]);

  // --- Countdown ---
  useEffect(() => {
    if (status === "paused" || status === "idle") return;

    if (status === "running" && timeLeft > 0) {
      const interval = setInterval(
        () => setTimeLeft((t) => Math.max(0, t - 1)),
        1000
      );
      return () => clearInterval(interval);
    } else if (status === "running" && timeLeft <= 0 && !isFinished) {
      setIsFinished(true);
      playAlarmSound();
    }
  }, [timeLeft, status, isFinished]);

  // --- Cleanup (Self-Destruct) ---
  useEffect(() => {
    if (isFinished) {
      const vanishTimer = setTimeout(() => {
        console.log(`⏰ Auto-removing timer ${id} from store...`);
        stopAlarm();
        removeTimerById(id);
      }, 5000);

      return () => {
        clearTimeout(vanishTimer);
        stopAlarm();
      };
    }
  }, [isFinished, id, removeTimerById]);

  // --- Unmount cleanup ---
  useEffect(() => {
    return () => stopAlarm();
  }, []);

  // --- Camera-local HUD offset ---
  const xOffset = 0.55;
  const yOffset = 0.25 - stackIndex * 0.15;
  const zOffset = -1;

  // --- Colors ---
  const bgColor = isFinished
    ? "#ef4444"
    : status === "paused"
      ? "#eab308"
      : "#1f2937";
  const borderColor = isFinished ? "#dc2626" : "#374151";

  const progressWidth = Math.max(0.01, (timeLeft / totalSeconds) * 0.4);

  return (
    <group ref={rootRef} frustumCulled={false} renderOrder={800}>
      <group position={[xOffset, yOffset, zOffset]}>
        {/* Background panel */}
        <RoundedBox
          args={[0.45, 0.18, 0.01]}
          radius={0.02}
          smoothness={4}
          renderOrder={800}
        >
          <meshStandardMaterial
            color={bgColor}
            transparent
            opacity={0.7}
            depthWrite={false}
          />
        </RoundedBox>

        {/* Border */}
        <RoundedBox
          args={[0.46, 0.19, 0.008]}
          radius={0.02}
          smoothness={4}
          position={[0, 0, -0.005]}
          renderOrder={799}
        >
          <meshStandardMaterial
            color={borderColor}
            transparent
            opacity={0.4}
            depthWrite={false}
          />
        </RoundedBox>

        {/* Label */}
        <Text
          position={[0, 0.06, 0.01]}
          fontSize={0.025}
          color={isFinished ? "#fef2f2" : "#9ca3af"}
          anchorX="center"
          anchorY="middle"
          renderOrder={801}
        >
          {isFinished ? "TIME'S UP!" : label.toUpperCase()}
          {status === "paused" ? " (PAUSED)" : ""}
        </Text>

        {/* Time display */}
        <Text
          position={[0, 0.0, 0.01]}
          fontSize={0.08}
          color="white"
          anchorX="center"
          anchorY="middle"
          font="/fonts/RobotoMono-Bold.ttf"
          renderOrder={801}
        >
          {formatTime(timeLeft)}
        </Text>

        {/* Progress bar background */}
        <mesh position={[0, -0.06, 0.01]} renderOrder={801}>
          <planeGeometry args={[0.4, 0.015]} />
          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={0.3}
            depthWrite={false}
          />
        </mesh>

        {/* Progress bar fill */}
        <mesh
          position={[-0.2 + progressWidth / 2, -0.06, 0.011]}
          renderOrder={802}
        >
          <planeGeometry args={[progressWidth, 0.015]} />
          <meshBasicMaterial
            color={
              isFinished
                ? "#ef4444"
                : status === "paused"
                  ? "#eab308"
                  : "#ffffff"
            }
            transparent
            opacity={0.9}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
