import { memo } from "react";
import { useGLTF } from "@react-three/drei";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";
import Monitor from "@/components/three/Monitor";

type DeskControls = {
    deskX: number;
    deskY: number;
    deskZ: number;
    deskScale: number;
};

type DeskProps = {
    proximityPosition: PositionArray;
};

const Desk = memo(({ proximityPosition }: DeskProps) => {
    const { desk } = useScene();
    const deskModel = useGLTF("/models/l_shaped_desk.glb");

    let deskX: number, deskY: number, deskZ: number, deskScale: number;

    // #if DEBUG
    ({ deskX, deskY, deskZ, deskScale } = useControls(
        "Desk",
        {
            deskX: {
                value: desk?.position?.x ?? 0,
                min: -20,
                max: 10,
                step: 0.01,
            },
            deskY: {
                value: desk?.position?.y ?? 0,
                min: -10,
                max: 10,
                step: 0.01,
            },
            deskZ: {
                value: desk?.position?.z ?? 0,
                min: -20,
                max: 10,
                step: 0.01,
            },
            deskScale: {
                value: desk?.scale ?? 0,
                min: 0.1,
                max: 10,
                step: 0.01,
            },
        },
        { collapsed: true }
    ) as DeskControls);
    // #endif

    // #if !DEBUG
    deskX = desk?.position?.x ?? 0;
    deskY = desk?.position?.y ?? 0;
    deskZ = desk?.position?.z ?? 0;
    deskScale = desk?.scale ?? 0;
    // #endif

    // L-shaped desk positioned snug in northwest corner
    const cornerX = deskX; // Very close to west wall
    const cornerZ = deskZ; // Very close to north wall
    const deskHeight = desk?.height ?? 0;

    return (
        <group
            position={[deskX, deskY, deskZ]}
            scale={[deskScale, deskScale, deskScale]}
        >
            {/* Desk model */}
            <primitive object={deskModel.scene} />

            {/* Monitor model */}
            <Monitor proximityPosition={proximityPosition} />

            {/* Invisible collision boxes */}
            <group>
                {/* Collision for horizontal desk section */}
                <mesh
                    position={[cornerX + 2.5, deskHeight / 2, cornerZ + 1]}
                    visible={false}
                >
                    <boxGeometry args={[5.2, deskHeight * 2, 2.2]} />
                </mesh>

                {/* Collision for vertical desk section */}
                <mesh
                    position={[cornerX + 1, deskHeight / 2, cornerZ + 3.5]}
                    visible={false}
                >
                    <boxGeometry args={[2.2, deskHeight * 2, 3.2]} />
                </mesh>
            </group>
        </group>
    );
});
Desk.displayName = "Desk";

useGLTF.preload("/models/l_shaped_desk.glb");

export default Desk;
