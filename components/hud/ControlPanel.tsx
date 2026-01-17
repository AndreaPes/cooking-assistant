import { useRef, useState } from "react";
import { RoundedBox, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { AssistantStatus } from "@/state/assistantState";
import { Group, Mesh, Quaternion, Vector3 } from "three";

interface ControlPanelProps {
  status: AssistantStatus;
  onMicClick: () => void;
}

export function ControlPanel({ status, onMicClick }: ControlPanelProps) {
  const rootRef = useRef<Group>(null);
  const micRef = useRef<Mesh>(null);
  const [micHovered, setMicHovered] = useState(false);

  // local "pressed" flash state (for visibility on click)
  const [pressed, setPressed] = useState(false);
  const pressedTimeoutRef = useRef<number | null>(null);

  // temp objects (avoid allocations)
  const tmpPos = useRef(new Vector3()).current;
  const tmpQuat = useRef(new Quaternion()).current;

  const getMicColor = () => {
    // Strong, very visible flash when pressed
    if (pressed) return "#22c55e"; // bright green
    if (status === AssistantStatus.LISTENING) return "#ef4444"; // red
    if (status === AssistantStatus.PROCESSING) return "#f59e0b"; // amber
    return "#374151"; // idle
  };

  const handlePress = () => {
    // trigger app logic
    onMicClick();

    // flash color briefly for visibility
    setPressed(true);
    if (pressedTimeoutRef.current) window.clearTimeout(pressedTimeoutRef.current);
    pressedTimeoutRef.current = window.setTimeout(() => setPressed(false), 220);
  };

  useFrame((state) => {
    // IMPORTANT: in XR, state.camera can be an ArrayCamera
    const camAny: any = state.camera;
    const cam: any = camAny.isArrayCamera ? camAny.cameras[0] : camAny;

    // Lock HUD to headset pose (world position + world rotation)
    if (rootRef.current) {
      cam.getWorldPosition(tmpPos);
      cam.getWorldQuaternion(tmpQuat);

      rootRef.current.position.copy(tmpPos);
      rootRef.current.quaternion.copy(tmpQuat);
      rootRef.current.frustumCulled = false;
    }

    // Mic animation (hover + pulse)
    if (micRef.current) {
      let targetScale = micHovered ? 1.1 : 1.0;

      if (status === AssistantStatus.LISTENING) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 12) * 0.1;
        targetScale *= pulse;
      }

      micRef.current.scale.lerp(
        { x: targetScale, y: targetScale, z: targetScale } as any,
        0.15
      );
    }
  });

  return (
    <group ref={rootRef} frustumCulled={false} renderOrder={999}>
      {/* Corner offset (TOP-RIGHT). Tweak as you want. */}
      <group position={[0.28, 0.18, -0.55]} renderOrder={999}>
        {/* Background (rounded square) */}
        <RoundedBox args={[0.18, 0.18, 0.03]} radius={0.09} smoothness={4}>
          <meshStandardMaterial
            color="#111827"
            transparent
            opacity={0.85}
            roughness={0.25}
            metalness={0.4}
            depthTest={false}
            depthWrite={false}
          />
        </RoundedBox>

        {/* Mic visuals */}
        <group position={[0, 0, 0.02]} renderOrder={999}>
          <mesh ref={micRef} renderOrder={999}>
            <circleGeometry args={[0.065, 32]} />
            <meshStandardMaterial
              color={getMicColor()}
              depthTest={false}
              depthWrite={false}
            />
          </mesh>

          <Text
            position={[0, 0, 0.01]}
            fontSize={0.06}
            color="white"
            anchorX="center"
            anchorY="middle"
            renderOrder={999}
          >
            🎙️
          </Text>
        </group>

        {/* HITBOX: use a circle (no "cylinder" feeling) and keep it invisible but raycastable */}
        <mesh
          position={[0, 0, 0.06]}
          renderOrder={1000}
          onPointerDown={(e) => {
            e.stopPropagation();
            handlePress();
          }}
          onClick={(e) => {
            e.stopPropagation();
            handlePress();
          }}
          onPointerOver={() => setMicHovered(true)}
          onPointerOut={() => setMicHovered(false)}
        >
          <circleGeometry args={[0.11, 32]} />
          <meshBasicMaterial
            transparent
            opacity={0} // invisible
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
