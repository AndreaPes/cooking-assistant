import { useEffect, useState, useRef, useCallback } from "react";
import { RoundedBox, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, Vector3, Quaternion, Mesh } from "three";
import { useCookingState } from "@/state/cookingState";
import { TimerItem } from "@/state/slices/timerSlice";

interface TimerProps extends TimerItem {
  /**
   * The vertical index for stacking multiple timers.
   * Used to calculate the Y-offset so timers do not overlap in the HUD.
   */
  stackIndex?: number;
}

/**
 * A 3D component representing a single active timer in the HUD.
 *
 * Features:
 * - XR Head-locking: Follows the user's view.
 * - Visual Feedback: Changes color based on state (Running, Paused, Finished).
 * - Audio Alarm: Plays a sound loop when the timer hits zero.
 * - 3D Progress Bar: Visualizes remaining time using a dynamic mesh.
 */
export function Timer({
  id,
  seconds,
  label = "Timer",
  status,
  stackIndex = 0,
}: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isFinished, setIsFinished] = useState(false);

  const rootRef = useRef<Group>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alarmStartedRef = useRef(false);
  const intervalRef = useRef<number | null>(null);
  const vanishTimeoutRef = useRef<number | null>(null);
  const prevSecondsRef = useRef(seconds);

  const tmpPos = useRef(new Vector3()).current;
  const tmpQuat = useRef(new Quaternion()).current;

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
      } catch {}
      a.loop = false;
    }
    audioRef.current = null;
  }, []);

  const playAlarmSound = useCallback(() => {
    if (alarmStartedRef.current) return;
    alarmStartedRef.current = true;

    const old = audioRef.current;
    if (old) {
      try {
        old.pause();
        old.currentTime = 0;
      } catch {}
    }

    const a = new Audio(
      "https://actions.google.com/sounds/v1/alarms/beep_short.ogg",
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

  useEffect(() => {
    const delta = seconds - prevSecondsRef.current;
    if (delta !== 0) {
      setTimeLeft((current) => Math.max(current + delta, 0));
      prevSecondsRef.current = seconds;
    }
  }, [seconds]);

  useEffect(() => {
    if (status !== "finished") {
      setIsFinished(false);
      stopAlarm();
    }

    if (status === "paused" || status === "idle") {
      clearTickInterval();
    }
  }, [status, stopAlarm, clearTickInterval]);

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

  useEffect(() => {
    if (!isFinished) return;

    playAlarmSound();

    vanishTimeoutRef.current = window.setTimeout(() => {
      stopAlarm();
      removeTimerById(id);
    }, 10000);

    return () => {
      if (vanishTimeoutRef.current !== null) {
        window.clearTimeout(vanishTimeoutRef.current);
        vanishTimeoutRef.current = null;
      }
    };
  }, [isFinished, id, playAlarmSound, stopAlarm, removeTimerById]);

  useEffect(() => {
    return () => {
      clearTickInterval();
      stopAlarm();
    };
  }, [clearTickInterval, stopAlarm]);

  const xOffset = 0.45;
  const yOffset = -0.15 - stackIndex * 0.18;
  const zOffset = -1;

  const getBackgroundColor = () => {
    if (isFinished) return "#7f1d1d";
    if (status === "paused") return "#713f12";
    return "#0f172a";
  };

  const getProgressColor = () => {
    if (isFinished) return "#ef4444";
    if (status === "paused") return "#facc15";
    return "#3b82f6";
  };

  const progress = Math.max(0, Math.min(1, timeLeft / (seconds || 1)));
  const barWidth = 0.35;
  const currentBarWidth = barWidth * progress;

  return (
    <group ref={rootRef} frustumCulled={false} renderOrder={800}>
      <group position={[xOffset, yOffset, zOffset]} scale={0.6}>
        <RoundedBox args={[0.45, 0.25, 0.02]} radius={0.05} smoothness={4}>
          <meshStandardMaterial
            color={getBackgroundColor()}
            transparent={true}
            opacity={0.9}
            roughness={0.2}
          />
        </RoundedBox>

        <group position={[0, 0, 0.02]}>
          <Text
            position={[0, 0.06, 0]}
            fontSize={0.03}
            color={status === "paused" ? "#facc15" : "#94a3b8"}
            anchorX="center"
            anchorY="bottom"
            letterSpacing={0.05}
          >
            {isFinished
              ? "TIME'S UP!"
              : `${label.toUpperCase()} ${status === "paused" ? "(PAUSED)" : ""}`}
          </Text>

          <Text
            position={[0, -0.01, 0]}
            fontSize={0.09}
            color="white"
            anchorX="center"
            anchorY="middle"
            font="https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxM.woff"
          >
            {isFinished ? "0:00" : formatTime(timeLeft)}
          </Text>

          <group position={[0, -0.07, 0]}>
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[barWidth, 0.015]} />
              <meshBasicMaterial
                color="white"
                opacity={0.2}
                transparent={true}
              />
            </mesh>

            <mesh position={[-barWidth / 2 + currentBarWidth / 2, 0, 0.001]}>
              <planeGeometry args={[currentBarWidth, 0.015]} />
              <meshBasicMaterial color={getProgressColor()} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
