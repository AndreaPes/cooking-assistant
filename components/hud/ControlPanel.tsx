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

  // temp objects (avoid allocations)
  const tmpPos = useRef(new Vector3()).current;
  const tmpQuat = useRef(new Quaternion()).current;

  const getMicColor = () => {
    if (status === AssistantStatus.LISTENING) return "#ef4444";
    if (status === AssistantStatus.PROCESSING) return "#f59e0b";
    return "#374151";
  };

  useFrame((state) => {
    // IMPORTANT: in XR, state.camera can be an ArrayCamera
    const camAny: any = state.camera;
    const cam: any = camAny.isArrayCamera ? camAny.cameras[0] : camAny;

    // 1) Lock HUD to headset pose (world position + world rotation)
    if (rootRef.current) {
      cam.getWorldPosition(tmpPos);
      cam.getWorldQuaternion(tmpQuat);

      rootRef.current.position.copy(tmpPos);
      rootRef.current.quaternion.copy(tmpQuat);

      rootRef.current.frustumCulled = false;
    }

    // 2) Mic animation
    if (micRef.current) {
      let targetScale = micHovered ? 1.1 : 1.0;

      if (status === AssistantStatus.LISTENING) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 12) * 0.1;
        targetScale *= pulse;
      }

      micRef.current.scale.lerp(
        { x: targetScale, y: targetScale, z: targetScale } as any,
        0.15,
      );
    }
  });

  return (
    <group ref={rootRef} frustumCulled={false} renderOrder={999}>
      {/* Camera-local offset (TOP-RIGHT). Tweak as you want. */}
      <group position={[0.3, 0.15, -0.8]} renderOrder={999}>
        {/* Background */}
        <RoundedBox args={[0.18, 0.18, 0.03]} radius={0.09} smoothness={4}>
          <meshStandardMaterial
            transparent={true}
            opacity={0}
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

        {/* Clickable hitbox (transparent, NOT visible=false) */}
        <mesh
          position={[0, 0, 0.06]}
          renderOrder={1000}
          onPointerDown={(e) => {
            e.stopPropagation();
            onMicClick();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onMicClick();
          }}
          onPointerOver={() => setMicHovered(true)}
          onPointerOut={() => setMicHovered(false)}
        >
          {/* Big easy target for XR rays */}
          <planeGeometry args={[0.22, 0.22]} />
          <meshBasicMaterial
            transparent
            opacity={0}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
