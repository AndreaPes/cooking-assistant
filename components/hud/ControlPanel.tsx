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
  const groupRef = useRef<Group>(null);
  const [micHovered, setMicHovered] = useState(false);
  const { camera } = useThree();

  // LOOP DI ANIMAZIONE (60 FPS)
  useFrame((state) => {
    // 1. Segui la camera (mantieni sempre la stessa posizione relativa)
    if (groupRef.current) {
      groupRef.current.position.copy(camera.position);
      groupRef.current.quaternion.copy(camera.quaternion);
    }

    // 2. Animazione del bottone
    if (micRef.current) {
      let targetScale = micHovered ? 1.1 : 1.0;

      // Animazione battito cardiaco quando ascolta
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
    if (status === AssistantStatus.LISTENING) return "#ef4444"; // Rosso
    if (status === AssistantStatus.PROCESSING) return "#f59e0b"; // Giallo
    return "#374151"; // Grigio scuro (Idle)
  };

  return (

    // Gruppo che segue la camera
    <group ref={groupRef}>
      {/* Offset relativo alla camera: 
          X: 0.5m a destra
          Y: -0.3m sotto l'altezza occhi
          Z: -1.2m davanti all'utente
      */}
      <group position={[0.5, 1, -1]} rotation={[0, -0.2, 0]}>
        {/* 1. SFONDO (Pillola di vetro) */}
        <RoundedBox args={[0.18, 0.18, 0.03]} radius={0.09} smoothness={4}>
          <meshStandardMaterial
            color="#111827"
            transparent
            opacity={0.8}
            roughness={0.2}
            metalness={0.5}
          />
        </RoundedBox>

        {/* 2. GRUPPO BOTTONE VISIVO */}
        <group position={[0, 0, 0.02]}>
          {/* Cerchio Colorato (Solo visivo) */}
          <mesh ref={micRef}>
            <circleGeometry args={[0.065, 32]} />
            <meshStandardMaterial color={getMicColor()} />
          </mesh>

          {/* Icona 3D (Testo) - Più sicuro dell'HTML in AR */}
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.06}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            🎙️
          </Text>
        </group>

        {/* 3. COLLIDER INVISIBILE (HIT BOX) 
            Questo è il trucco: un cerchio invisibile DAVANTI a tutto (z=0.05)
            che cattura il click senza interferenze.
        */}
        <mesh
          position={[0, 0, 0.05]} // Ben avanti rispetto al resto
          visible={false} // Invisibile
          onClick={(e) => {
            e.stopPropagation();
            console.log("🖱️ 3D Button Clicked!"); // Debug log
            onMicClick();
          }}
          onPointerOver={() => setMicHovered(true)}
          onPointerOut={() => setMicHovered(false)}
        >
          {/* Un po' più grande del bottone visivo per facilitare il click */}
          <circleGeometry args={[0.09, 16]} />
          <meshBasicMaterial />
        </mesh>
      </group>
    </group>
  );
}
