import { useGLTF } from "@react-three/drei";
import { useControls, folder } from 'leva';
import * as THREE from "three";
import { useScene } from "@/lib/contexts/SceneContext";
import { useMovement } from "@/lib/stores/useMovement";
import Monitor from "@/components/Monitor";

export default function Desk() {
  const { desk } = useScene();
  const { position: characterPosition } = useMovement();
  const deskModel = useGLTF('/models/l_shaped_desk.glb');

  const {
    deskX,
    deskY,
    deskZ,
    deskScale
  } = useControls({
    Desk: folder({
      deskX: { value: desk?.position?.x, min: -20, max: 10, step: 0.01 },
      deskY: { value: desk?.position?.y, min: -10, max: 10, step: 0.01 },
      deskZ: { value: desk?.position?.z, min: -20, max: 10, step: 0.01 },
      deskScale: { value: desk?.scale, min: 0.1, max: 10, step: 0.01 },
    }, { collapsed: true })
  });

  // L-shaped desk positioned snug in northwest corner
  const cornerX = deskX ?? desk?.position?.x; // Very close to west wall
  const cornerZ = deskZ ?? desk?.position?.z; // Very close to north wall
  const deskHeight = desk?.height;

  return (
    <group
      position={[deskX, deskY, deskZ]}
      scale={[deskScale, deskScale, deskScale]}
    >
      {/* Desk model */}
      <primitive
        object={deskModel.scene}
      />

      {/* Monitor model */}
      <Monitor
        proximityPosition={new THREE.Vector3(...Object.values(characterPosition))}
      />

      {/* Invisible collision boxes */}
      <group>
        {/* Collision for horizontal desk section */}
        <mesh position={[cornerX + 2.5, deskHeight / 2, cornerZ + 1]} visible={false}>
          <boxGeometry args={[5.2, deskHeight * 2, 2.2]} />
        </mesh>

        {/* Collision for vertical desk section */}
        <mesh position={[cornerX + 1, deskHeight / 2, cornerZ + 3.5]} visible={false}>
          <boxGeometry args={[2.2, deskHeight * 2, 3.2]} />
        </mesh>
      </group>
    </group>
  );
}

useGLTF.preload('/models/l_shaped_desk.glb');