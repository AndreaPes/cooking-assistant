import { useRef } from "react";
import { RoundedBox, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, Quaternion, Vector3 } from "three";

interface InfoPanelProps {
  text: string;
  onClose?: () => void;
}

export function InfoPanel({ text, onClose }: InfoPanelProps) {
  const rootRef = useRef<Group>(null);
  const panelRef = useRef<Group>(null);

  // temp objects (NO allocations)
  const tmpPos = useRef(new Vector3()).current;
  const tmpQuat = useRef(new Quaternion()).current;

  // animation state
  const t = useRef(0);
  const closing = useRef(false);
  const lifetime = useRef(0);

  useFrame((state, delta) => {
    const camAny: any = state.camera;
    const cam = camAny.isArrayCamera ? camAny.cameras[0] : camAny;

    // 1) Lock to headset
    if (rootRef.current) {
      cam.getWorldPosition(tmpPos);
      cam.getWorldQuaternion(tmpQuat);

      rootRef.current.position.copy(tmpPos);
      rootRef.current.quaternion.copy(tmpQuat);
      rootRef.current.frustumCulled = false;
    }

    // 2) Lifetime handling
    lifetime.current += delta;
    if (lifetime.current > 8 && !closing.current) {
      closing.current = true;
    }

    // 3) Animation
    if (panelRef.current) {
      if (!closing.current) {
        t.current = Math.min(t.current + delta * 2.5, 1);
      } else {
        t.current = Math.max(t.current - delta * 3, 0);
        if (t.current === 0 && onClose) onClose();
      }

      panelRef.current.position.y = t.current * 0.08;
      panelRef.current.scale.setScalar(0.85 + t.current * 0.15);
    }
  });

  return (
    <group ref={rootRef} frustumCulled={false} renderOrder={998}>
      {/* Camera-local offset: CENTER */}
      <group position={[0, 0.05, -1]} renderOrder={998}>
        <group ref={panelRef}>
          {/* Background */}
          <RoundedBox args={[0.9, 0.45, 0.04]} radius={0.08}>
            <meshStandardMaterial
              color="#111827"
              transparent
              opacity={0.92}
              depthTest={false}
              depthWrite={false}
            />
          </RoundedBox>

          {/* Header */}
          <Text
            position={[-0.35, 0.16, 0.03]}
            fontSize={0.03}
            color="#60a5fa"
            anchorX="left"
            anchorY="middle"
          >
            ASSISTANT
          </Text>

          {/* Divider */}
          <mesh position={[0, 0.11, 0.03]}>
            <planeGeometry args={[0.75, 0.002]} />
            <meshStandardMaterial
              color="#1f2933"
              depthTest={false}
              depthWrite={false}
            />
          </mesh>

          {/* Content */}
          <Text
            position={[0, -0.02, 0.03]}
            maxWidth={0.75}
            fontSize={0.045}
            lineHeight={1.3}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {text}
          </Text>
        </group>
      </group>
    </group>
  );
}
