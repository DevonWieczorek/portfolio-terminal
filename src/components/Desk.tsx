import { useGLTF, Html } from "@react-three/drei";
import { useControls, folder } from 'leva';
import * as THREE from "three";
import { useScene } from "@/lib/contexts/SceneContext";
import { useMovement } from "@/lib/stores/useMovement";
import InteractiveBox from "@/components/InteractiveBox";

const MonitorTooltipContent = () => (
  <Html>
    <div style={{ textAlign: 'center' }}>
      <div>Press ENTER</div>
      <div>to use computer.</div>
    </div>
  </Html>
);

const MonitorWithTooltip = ({
  object,
  position,
  proximityPosition,
  rotation,
}) => {
  return (
    <group>
      <primitive
        object={object}
        position={position}
        rotation={rotation}
      />
      <InteractiveBox
        position={position}
        tooltipContent={<MonitorTooltipContent />}
        proximityPosition={proximityPosition}
      />
    </group>
  );
};

export default function Desk() {
  const { desk, monitor } = useScene();
  const { position: characterPosition } = useMovement();
  const deskModel = useGLTF('/models/l_shaped_desk.glb');
  const monitorModel = useGLTF('/models/monitor.glb');

  const {
    monitorRotationY,
    monitorX,
    monitorY,
    monitorZ,
    deskX,
    deskY,
    deskZ,
    deskScale
  } = useControls({
    Monitor: folder({
      monitorRotationY: { value: monitor?.rotation?.y, min: -5, max: Math.PI * 2, step: 0.01 },
      monitorX: { value: monitor?.position?.x, min: -20, max: 10, step: 0.01 },
      monitorY: { value: monitor?.position?.y, min: -10, max: 10, step: 0.01 },
      monitorZ: { value: monitor?.position?.z, min: -20, max: 10, step: 0.01 },
    }),
    Desk: folder({
      deskX: { value: desk?.position?.x, min: -20, max: 10, step: 0.01 },
      deskY: { value: desk?.position?.y, min: -10, max: 10, step: 0.01 },
      deskZ: { value: desk?.position?.z, min: -20, max: 10, step: 0.01 },
      deskScale: { value: desk?.scale, min: 0.1, max: 10, step: 0.01 },
    })
  });

  // L-shaped desk positioned snug in northwest corner
  const cornerX = desk?.position?.x; // Very close to west wall
  const cornerZ = desk?.position?.z; // Very close to north wall
  const deskHeight = desk?.height;

  return (
    <group>
      {/* Desk model */}
      <primitive
        object={deskModel.scene}
        position={[deskX, deskY, deskZ]}
        scale={[deskScale, deskScale, deskScale]}
      />

      {/* Monitor model */}
      <MonitorWithTooltip
        object={monitorModel.scene}
        position={[monitorX, monitorY, monitorZ]}
        proximityPosition={new THREE.Vector3(...Object.values(characterPosition))}
        rotation={[0, monitorRotationY, 0]}
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

        {/* Collision for monitor */}
        <mesh position={[cornerX + 3, deskHeight + 0.6, cornerZ + 0.3]} visible={false}>
          <boxGeometry args={[1.4, 1.2, 1]} />
        </mesh>
      </group>
    </group>
  );
}

useGLTF.preload('/models/l_shaped_desk.glb');
useGLTF.preload('/models/monitor.glb');