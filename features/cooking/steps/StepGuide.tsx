import { useRef } from "react";
import { Text, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, Quaternion, Vector3, Mesh } from "three";
import { AtomicStep } from "@/types/interfaces";

interface StepGuideProps {
  /**
   * The current cooking step to display.
   */
  step: AtomicStep;
  /**
   * The zero-based index of the current step.
   */
  stepIndex: number;
  /**
   * The total number of steps in the recipe.
   */
  totalSteps: number;
}

/**
 * A 3D head-locked HUD component that displays the current cooking step instructions.
 *
 * Features:
 * - Shows the step counter (e.g., Step 01 / 10).
 * - Displays high-priority warnings (e.g., "HOT OIL") with a pulsating animation.
 * - highlights the main action verb and target object for quick reading.
 * - Provides detailed instructions in a secondary text block.
 */
export function StepGuide({ step, stepIndex, totalSteps }: StepGuideProps) {
  const rootRef = useRef<Group>(null);
  const warningRef = useRef<Mesh>(null);

  const tmpPos = useRef(new Vector3()).current;
  const tmpQuat = useRef(new Quaternion()).current;

  useFrame((state) => {
    if (rootRef.current) {
      const camAny: any = state.camera;
      const cam = camAny.isArrayCamera ? camAny.cameras[0] : camAny;

      cam.getWorldPosition(tmpPos);
      cam.getWorldQuaternion(tmpQuat);

      rootRef.current.position.copy(tmpPos);
      rootRef.current.quaternion.copy(tmpQuat);
      rootRef.current.frustumCulled = false;
    }

    if (step?.warning && warningRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 8) * 0.05;
      warningRef.current.scale.set(pulse, pulse, 1);
    }
  });

  if (!step) return null;

  const current = (stepIndex + 1).toString().padStart(2, "0");
  const total = totalSteps.toString().padStart(2, "0");
  const actionColor = "#f97316";

  return (
    <group ref={rootRef} frustumCulled={false} renderOrder={900}>
      <group position={[0, 0.2, -1]} scale={0.6}>
        <RoundedBox args={[0.9, 0.7, 0.02]} radius={0.05} smoothness={4}>
          <meshStandardMaterial
            color="#0f172a"
            transparent={true}
            opacity={0.9}
            roughness={0.2}
          />
        </RoundedBox>

        <group position={[-0.28, 0.18, 0.02]}>
          <Text
            position={[0, 0.09, 0.01]}
            fontSize={0.04}
            color="#fb923c"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.05}
          >
            STEP {current} / {total}
          </Text>
        </group>

        {step.warning && (
          <group position={[0.2, 0.12, 0.02]}>
            <RoundedBox
              ref={warningRef}
              args={[0.35, 0.08, 0.01]}
              radius={0.02}
            >
              <meshStandardMaterial color="#7f1d1d" />
            </RoundedBox>
            <Text
              position={[0, 0, 0.02]}
              fontSize={0.035}
              color="#fca5a5"
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              ⚠️ {step.warning}
            </Text>
          </group>
        )}

        <group position={[0, 0.05, 0.03]}>
          <Text
            position={[-0.38, 0.1, 0]}
            fontSize={0.035}
            color="#94a3b8"
            anchorX="left"
            anchorY="bottom"
          >
            ACTION
          </Text>
          <Text
            position={[-0.38, 0, 0]}
            fontSize={0.08}
            color={actionColor}
            anchorX="left"
            anchorY="bottom"
            maxWidth={0.8}
          >
            {step.actionVerb}
          </Text>

          <Text
            position={[-0.38, 0, 0]}
            fontSize={0.035}
            color="#94a3b8"
            anchorX="left"
            anchorY="top"
          >
            TARGET
          </Text>
          <Text
            position={[-0.38, -0.04, 0]}
            fontSize={0.08}
            color="white"
            anchorX="left"
            anchorY="top"
            maxWidth={0.8}
          >
            {step.targetObject}
          </Text>
        </group>

        <mesh position={[0, -0.12, 0.02]}>
          <planeGeometry args={[0.8, 0.005]} />
          <meshBasicMaterial color="white" opacity={0.1} transparent={true} />
        </mesh>

        <Text
          position={[0, -0.15, 0.03]}
          fontSize={0.035}
          color="#e2e8f0"
          anchorX="center"
          anchorY="top"
          maxWidth={0.8}
          textAlign="center"
          lineHeight={1.4}
        >
          {step.details}
        </Text>
      </group>
    </group>
  );
}
