import { memo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useMovement } from "@/lib/stores/useMovement";
import { useScene } from "@/lib/contexts/SceneContext";
import { useMessage } from "@/lib/contexts/MessageContext";
import Desk from "@/components/three/Desk";
import BassGroup from "@/components/three/BassGroup";
import SkateboardGroup from "@/components/three/SkateboardGroup";
import Baseboards from "@/components/three/Baseboards";
import Rug from "@/components/three/Rug";
import { INTRO_MESSAGE } from "@/lib/constants/sceneMessages";
import {
    useSurfaceTextures,
    type SurfaceTextures,
} from "@/hooks/use-surface-textures";

type SurfaceControls = {
    floorTileSize: number;
    floorRoughness: number;
    floorNormalScale: number;
    wallTileSize: number;
    wallRoughness: number;
    wallNormalScale: number;
};

interface RoomProps {
    onReady?: () => void;
}

const Room = memo(({ onReady }: RoomProps) => {
    const {
        roomSize,
        wallColor,
        wallHeight,
        wallThickness,
        floorSurface,
        wallSurface,
    } = useScene();
    const { setMessage } = useMessage();

    let floorTileSize: number,
        floorRoughness: number,
        floorNormalScale: number,
        wallTileSize: number,
        wallRoughness: number,
        wallNormalScale: number;

    // #if DEBUG
    ({
        floorTileSize,
        floorRoughness,
        floorNormalScale,
        wallTileSize,
        wallRoughness,
        wallNormalScale,
    } = useControls(
        "Surfaces",
        {
            floorTileSize: {
                value: floorSurface.tileSize,
                min: 1,
                max: 20,
                step: 0.1,
            },
            floorRoughness: {
                value: floorSurface.roughness,
                min: 0,
                max: 1,
                step: 0.05,
            },
            floorNormalScale: {
                value: floorSurface.normalScale,
                min: 0,
                max: 2,
                step: 0.05,
            },
            wallTileSize: {
                value: wallSurface.tileSize,
                min: 1,
                max: 20,
                step: 0.1,
            },
            wallRoughness: {
                value: wallSurface.roughness,
                min: 0,
                max: 1,
                step: 0.05,
            },
            wallNormalScale: {
                value: wallSurface.normalScale,
                min: 0,
                max: 2,
                step: 0.05,
            },
        },
        { collapsed: true }
    ) as SurfaceControls);
    // #endif

    // #if !DEBUG
    floorTileSize = floorSurface.tileSize;
    floorRoughness = floorSurface.roughness;
    floorNormalScale = floorSurface.normalScale;
    wallTileSize = wallSurface.tileSize;
    wallRoughness = wallSurface.roughness;
    wallNormalScale = wallSurface.normalScale;
    // #endif

    // Box UVs span each face once, so the repeat count is the face size over
    // the tile size. Every wall's large face is roomSize x wallHeight, so the
    // walls can share one texture set.
    const floorTextures = useSurfaceTextures(
        floorSurface.textures,
        roomSize / floorTileSize,
        roomSize / floorTileSize
    );
    const wallTextures = useSurfaceTextures(
        wallSurface.textures,
        roomSize / wallTileSize,
        wallHeight / wallTileSize
    );

    useEffect(() => {
        setMessage(INTRO_MESSAGE);
        onReady?.();
    }, [onReady, setMessage]);

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
                <SurfaceMaterial
                    textures={floorTextures}
                    roughness={floorRoughness}
                    normalScale={floorNormalScale}
                />
            </mesh>

            {/* North Wall */}
            <mesh position={[0, wallHeight / 2, -roomSize / 2]} receiveShadow>
                <boxGeometry args={[roomSize, wallHeight, wallThickness]} />
                <SurfaceMaterial
                    textures={wallTextures}
                    roughness={wallRoughness}
                    normalScale={wallNormalScale}
                    color={wallColor}
                />
            </mesh>

            <Rug />
            <Baseboards />

            <BassGroup proximityPosition={proximityPositionRef.current} />

            {/* Desk and Computer Setup */}
            <Desk proximityPosition={proximityPositionRef.current} />

            {/* South Wall */}
            <mesh position={[0, wallHeight / 2, roomSize / 2]} receiveShadow>
                <boxGeometry args={[roomSize, wallHeight, wallThickness]} />
                <SurfaceMaterial
                    textures={wallTextures}
                    roughness={wallRoughness}
                    normalScale={wallNormalScale}
                    color={wallColor}
                />
            </mesh>

            {/* East Wall */}
            <mesh position={[roomSize / 2, wallHeight / 2, 0]} receiveShadow>
                <boxGeometry args={[wallThickness, wallHeight, roomSize]} />
                <SurfaceMaterial
                    textures={wallTextures}
                    roughness={wallRoughness}
                    normalScale={wallNormalScale}
                    color={wallColor}
                />
            </mesh>

            <SkateboardGroup proximityPosition={proximityPositionRef.current} />

            {/* West Wall */}
            <mesh position={[-roomSize / 2, wallHeight / 2, 0]} receiveShadow>
                <boxGeometry args={[wallThickness, wallHeight, roomSize]} />
                <SurfaceMaterial
                    textures={wallTextures}
                    roughness={wallRoughness}
                    normalScale={wallNormalScale}
                    color={wallColor}
                />
            </mesh>
        </group>
    );
});
Room.displayName = "Room";

type SurfaceMaterialProps = {
    textures: SurfaceTextures;
    roughness: number;
    normalScale: number;
    color?: string;
};

const SurfaceMaterial = ({
    textures,
    roughness,
    normalScale,
    color = "#ffffff",
}: SurfaceMaterialProps) => (
    <meshStandardMaterial
        {...textures}
        roughness={roughness}
        normalScale={[normalScale, normalScale]}
        color={color}
    />
);

export default Room;
