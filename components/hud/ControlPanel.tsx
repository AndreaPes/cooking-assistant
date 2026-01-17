import { useRef, useState } from "react";
import { RoundedBox, Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { AssistantStatus } from "@/state/assistantState";
import { Mesh, Group } from "three";

interface ControlPanelProps {
  status: AssistantStatus;
  onMicClick: () => void;
}

export function ControlPanel({ status, onMicClick }: ControlPanelProps) {
  const micRef = useRef<Mesh>(null);
  const rootRef = useRef<Group>(null);
  const [micHovered, setMicHovered] = useState(false);
  const { camera } = useThree();

  useFrame((state) => {
    // HUD: lock to camera (Quest)
    if (rootRef.current) {
      rootRef.current.position.copy(camera.position);
      rootRef.current.quaternion.copy(camera.quaternion);
      rootRef.current.frustumCulled = false;
    }

    // Mic animation
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

  const getMicColor = () => {
    if (status === AssistantStatus.LISTENING) return "#ef4444";
    if (status === AssistantStatus.PROCESSING) return "#f59e0b";
    return "#374151";
  };

  return (
    <group ref={rootRef} frustumCulled={false} renderOrder={999}>
      {/* Corner offset (camera-local). Tweak these. */}
      <group position={[0.28, 0.18, -0.55]} renderOrder={999}>
        {/* Background */}
        <RoundedBox args={[0.18, 0.18, 0.03]} radius={0.09} smoothness={4}>
          <meshStandardMaterial
            color="#111827"
            transparent
            opacity={0.8}
            roughness={0.2}
            metalness={0.5}
            depthTest={false}
            depthWrite={false}
          />
        </RoundedBox>

        {/* Visual mic */}
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

        {/* Click / hover hitbox (TRANSPARENT, not visible=false) */}
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
          {/* Big and easy to hit */}
          <planeGeometry args={[0.22, 0.22]} />
          <meshBasicMaterial
            transparent
            opacity={0}          // invisible but raycastable
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
