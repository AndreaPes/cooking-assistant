import { useRef, useState } from "react";
import { Text, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { AssistantStatus } from "@/state/assistantState";
import { Mesh } from "three";

interface ControlPanelProps {
  status: AssistantStatus;
  isCameraMode: boolean;
  onToggleCamera: () => void;
  onMicClick: () => void;
}

export function ControlPanel({
  status,
  isCameraMode,
  onToggleCamera,
  onMicClick,
}: ControlPanelProps) {
  // Riferimenti alle mesh per le animazioni
  const micRef = useRef<Mesh>(null);
  const camRef = useRef<Mesh>(null);

  // Stati locali per effetto Hover (quando il raggio del controller ci passa sopra)
  const [micHovered, setMicHovered] = useState(false);
  const [camHovered, setCamHovered] = useState(false);

  // LOOP DI ANIMAZIONE (60 FPS)
  useFrame((state) => {
    // 1. Animazione Pulsazione Microfono (quando ascolta)
    if (micRef.current) {
      let targetScale = micHovered ? 1.2 : 1.0;

      if (status === AssistantStatus.LISTENING) {
        // Crea un battito cardiaco usando il tempo
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.1;
        targetScale *= pulse;
      }

      // Interpolazione fluida (Lerp) verso la dimensione target
      micRef.current.scale.lerp(
        { x: targetScale, y: targetScale, z: targetScale } as any,
        0.1,
      );
    }

    // 2. Animazione Hover Camera
    if (camRef.current) {
      const targetScale = camHovered ? 1.2 : 1.0;
      camRef.current.scale.lerp(
        { x: targetScale, y: targetScale, z: targetScale } as any,
        0.1,
      );
    }
  });

  // Colore dinamico del microfono
  const getMicColor = () => {
    if (status === AssistantStatus.LISTENING) return "#ef4444"; // Rosso
    if (status === AssistantStatus.PROCESSING) return "#f59e0b"; // Giallo
    return "#374151"; // Grigio scuro (Idle)
  };

  return (
    // POSIZIONE HUD: Basso centrale, ruotato verso il viso
    <group position={[0, -0.25, -0.6]} rotation={[-0.4, 0, 0]}>
      {/* --- SFONDO (Vetro scuro) --- */}
      <RoundedBox args={[0.35, 0.12, 0.01]} radius={0.05} smoothness={4}>
        <meshStandardMaterial
          color="#111827"
          transparent
          opacity={0.8}
          roughness={0.2}
          metalness={0.5}
        />
      </RoundedBox>

      {/* --- BOTTONE CAMERA (Sinistra) --- */}
      <group position={[-0.08, 0, 0.02]}>
        {/* Cerchio cliccabile */}
        <mesh
          ref={camRef}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCamera();
          }}
          onPointerOver={() => setCamHovered(true)}
          onPointerOut={() => setCamHovered(false)}
        >
          <circleGeometry args={[0.035, 32]} />
          <meshStandardMaterial color={isCameraMode ? "#22c55e" : "#4b5563"} />
        </mesh>
        {/* Icona (Emoji Testo 3D) */}
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.03}
          anchorX="center"
          anchorY="middle"
        >
          📷
        </Text>
      </group>

      {/* --- DIVISORE (Linea bianca) --- */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[0.002, 0.08]} />
        <meshBasicMaterial color="white" opacity={0.2} transparent />
      </mesh>

      {/* --- BOTTONE MICROFONO (Destra) --- */}
      <group position={[0.08, 0, 0.02]}>
        {/* Cerchio cliccabile */}
        <mesh
          ref={micRef}
          onClick={(e) => {
            e.stopPropagation();
            onMicClick();
          }}
          onPointerOver={() => setMicHovered(true)}
          onPointerOut={() => setMicHovered(false)}
        >
          <circleGeometry args={[0.045, 32]} />
          <meshStandardMaterial color={getMicColor()} />
        </mesh>
        {/* Icona */}
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.04}
          anchorX="center"
          anchorY="middle"
        >
          🎙️
        </Text>
      </group>
    </group>
  );
}
