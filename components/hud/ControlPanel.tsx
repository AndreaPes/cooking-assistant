import { useRef, useState } from "react";
import { RoundedBox, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { AssistantStatus } from "@/state/assistantState";
import { Mesh } from "three";

interface ControlPanelProps {
  status: AssistantStatus;
  onMicClick: () => void;
}

export function ControlPanel({ status, onMicClick }: ControlPanelProps) {
  const micRef = useRef<Mesh>(null);
  const [micHovered, setMicHovered] = useState(false);

  // LOOP DI ANIMAZIONE (60 FPS)
  useFrame((state) => {
    if (micRef.current) {
      let targetScale = micHovered ? 1.1 : 1.0;

      // Animazione battito cardiaco quando ascolta
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

  const getMicColor = () => {
    if (status === AssistantStatus.LISTENING) return "#ef4444"; // Rosso
    if (status === AssistantStatus.PROCESSING) return "#f59e0b"; // Giallo
    return "#374151"; // Grigio scuro (Idle)
  };

  return (
    // POSIZIONE: Alto a Destra
    <group position={[0.35, 1, -0.8]} rotation={[-0.1, -0.3, 0]}>
      {/* 1. SFONDO (Pillola di vetro) */}
      <RoundedBox args={[0.14, 0.14, 0.02]} radius={0.07} smoothness={4}>
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
          <circleGeometry args={[0.05, 32]} />
          <meshStandardMaterial color={getMicColor()} />
        </mesh>

        {/* Icona 3D (Testo) - Più sicuro dell'HTML in AR */}
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.05}
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
        <circleGeometry args={[0.07, 16]} />
        <meshBasicMaterial color="red" wireframe />
        {/* Wireframe solo se vuoi debuggare */}
      </mesh>
    </group>
  );
}
