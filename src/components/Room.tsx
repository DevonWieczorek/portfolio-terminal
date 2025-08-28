import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useScene } from "../lib/contexts/SceneContext";
import Desk from "./Desk";
import Bass from "./Bass";

export default function Room() {
  const { roomSize, wallColor, wallHeight, wallThickness } = useScene();

  // Load wood texture for floor
  const floorTexture = useTexture("/textures/wood.jpg");

  // Configure texture repeat for wooden floor
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(8, 8); // Wood plank pattern repeat

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

      {/* West Wall */}
      <mesh position={[-roomSize / 2, wallHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, wallHeight, roomSize]} />
        <meshLambertMaterial color={wallColor} />
      </mesh>

      <Bass />

      {/* Desk and Computer Setup */}
      <Desk />
    </group>
  );
}
