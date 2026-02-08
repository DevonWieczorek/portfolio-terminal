import { memo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useMovement } from "@/lib/stores/useMovement";
import { useScene } from "@/lib/contexts/SceneContext";
import Desk from "@/components/three/Desk";
import BassGroup from "@/components/three/BassGroup";
import SkateboardGroup from "@/components/three/SkateboardGroup";

const Room = memo(() => {
    const { roomSize, wallColor, wallHeight, wallThickness } = useScene();

    // Load wood texture for floor
    const floorTexture = useTexture("/textures/wood.jpg");

    // Configure texture repeat for wooden floor - moved to useEffect to prevent reconfiguration on every render
    useEffect(() => {
        floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;

        const plankSize = 1; // World units per plank
        const repeatsX = Math.ceil(roomSize / plankSize);

        floorTexture.repeat.set(repeatsX, 8);
        floorTexture.needsUpdate = true; // Critical to apply changes
    }, [floorTexture, roomSize]);

    // Keep a stable vector reference and mutate it in the frame loop so
    // movement updates do not force React rerenders of the room subtree.
    const proximityPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());

    useFrame(() => {
        const { position } = useMovement.getState();
        proximityPositionRef.current.set(position.x, position.y, position.z);
    });

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

            <BassGroup proximityPosition={proximityPositionRef.current} />

            {/* Desk and Computer Setup */}
            <Desk proximityPosition={proximityPositionRef.current} />

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

            <SkateboardGroup proximityPosition={proximityPositionRef.current} />

            {/* West Wall */}
            <mesh position={[-roomSize / 2, wallHeight / 2, 0]} receiveShadow>
                <boxGeometry args={[wallThickness, wallHeight, roomSize]} />
                <meshLambertMaterial color={wallColor} />
            </mesh>
        </group>
    );
});
Room.displayName = "Room";

export default Room;
