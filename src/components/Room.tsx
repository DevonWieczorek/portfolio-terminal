import { useEffect, useState } from 'react';
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useMovement } from "@/lib/stores/useMovement";
import { useScene } from "@/lib/contexts/SceneContext";
import Desk from "@/components/Desk";
import BassGroup from "@/components/BassGroup";
import SkateboardGroup from "@/components/SkateboardGroup";

export default function Room() {
  const [proxyPosition, setProxyPosition] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const { position: characterPosition } = useMovement();
  const { roomSize, wallColor, wallHeight, wallThickness } = useScene();

  // Load wood texture for floor
  const floorTexture = useTexture("/textures/wood.jpg");

  // Configure texture repeat for wooden floor
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(8, 8); // Wood plank pattern repeat

  useEffect(() => {
    setProxyPosition(new THREE.Vector3(...Object.values(characterPosition)));
  }, [characterPosition]);

  return (
    <group>
      {/* Floor */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[roomSize, 1, roomSize]} />
        <meshLambertMaterial map={floorTexture} />
      </mesh>

      {/* North Wall */}
      <mesh position={[0, wallHeight / 2, -roomSize / 2]} receiveShadow>
        <boxGeometry args={[roomSize, wallHeight, wallThickness]} />
        <meshLambertMaterial color={wallColor} />
      </mesh>

      <BassGroup proximityPosition={proxyPosition} />

      {/* Desk and Computer Setup */}
      <Desk />

      {/* South Wall */}
      <mesh position={[0, wallHeight / 2, roomSize / 2]} receiveShadow>
        <boxGeometry args={[roomSize, wallHeight, wallThickness]} />
        <meshLambertMaterial color={wallColor} />
      </mesh>

      {/* East Wall */}
      <mesh position={[roomSize / 2, wallHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, wallHeight, roomSize]} />
        <meshLambertMaterial color={wallColor} />
      </mesh>

      <SkateboardGroup proximityPosition={proxyPosition} />

      {/* West Wall */}
      <mesh position={[-roomSize / 2, wallHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, wallHeight, roomSize]} />
        <meshLambertMaterial color={wallColor} />
      </mesh>

    </group>
  );
}
