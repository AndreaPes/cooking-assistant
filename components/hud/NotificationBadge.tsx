import { useRef } from "react";
import { RoundedBox, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, Quaternion, Vector3 } from "three";

type BadgeVariant = "success" | "error" | "neutral";

interface NotificationBadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function NotificationBadge({
  label,
  variant = "success",
}: NotificationBadgeProps) {
  const rootRef = useRef<Group>(null);
  const badgeRef = useRef<Group>(null);

  // temp objects (NO allocations)
  const tmpPos = useRef(new Vector3()).current;
  const tmpQuat = useRef(new Quaternion()).current;

  // animation state (frame-based)
  const appear = useRef(0);

  const styles = {
    success: { color: "#4ade80" },
    error: { color: "#f87171" },
    neutral: { color: "#e5e7eb" },
  };

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

    // 2) Slide + fade animation
    if (badgeRef.current) {
      appear.current = Math.min(appear.current + delta * 3, 1);

      badgeRef.current.position.y = appear.current * 0.08;
      badgeRef.current.scale.setScalar(0.8 + appear.current * 0.2);
    }
  });

  return (
    <group ref={rootRef} frustumCulled={false} renderOrder={999}>
      {/* Camera-local offset: TOP CENTER */}
      <group position={[0, 0.28, -0.9]} renderOrder={999}>
        <group ref={badgeRef}>
          {/* Background */}
          <RoundedBox args={[0.6, 0.12, 0.03]} radius={0.06}>
            <meshStandardMaterial
              color="#111827"
              transparent
              opacity={0.9}
              depthTest={false}
              depthWrite={false}
            />
          </RoundedBox>

          {/* Text */}
          <Text
            position={[0.02, 0, 0.02]}
            fontSize={0.045}
            color="white"
            anchorX="center"
            anchorY="middle"
            renderOrder={1000}
          >
            {label.toUpperCase()}
          </Text>
        </group>
      </group>
    </group>
  );
}
