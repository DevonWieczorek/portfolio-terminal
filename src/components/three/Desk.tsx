import { memo, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";
import Monitor from "@/components/three/Monitor";
import { getModelBounds } from "@/utils/three";

type DeskControls = {
    deskX: number;
    deskY: number;
    deskZ: number;
    deskScale: number;
};

type DeskProps = {
    proximityPosition: PositionArray;
};

const DESK_MODEL_PATH = "/models/l_shaped_desk.glb";
// Height of the desk top in the model's own units. Normalizing to 1 lets
// `desk.scale` represent the desk top height in scene units.
const MODEL_HEIGHT = 0.904;

const Desk = memo(({ proximityPosition }: DeskProps) => {
    const { desk } = useScene();
    const deskModel = useGLTF(DESK_MODEL_PATH);

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
                min: 0.5,
                max: 5,
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

    // The model's pivot isn't at a corner, so measure it once and shift it so
    // its back-left corner sits on the group origin
    const modelBounds = useMemo(
        () => getModelBounds(deskModel.scene),
        [deskModel.scene]
    );
    const modelScale = deskScale / MODEL_HEIGHT;
    const modelOffset: Coordinate = modelBounds.isEmpty()
        ? [0, 0, 0]
        : [
              -modelBounds.min.x * modelScale,
              -modelBounds.min.y * modelScale,
              -modelBounds.min.z * modelScale,
          ];

    return (
        <group position={[deskX, deskY, deskZ]}>
            {/* Desk model */}
            <group
                position={modelOffset}
                scale={[modelScale, modelScale, modelScale]}
            >
                <primitive object={deskModel.scene} />
            </group>

            {/* Monitor model */}
            <Monitor proximityPosition={proximityPosition} />
        </group>
    );
});
Desk.displayName = "Desk";

useGLTF.preload(DESK_MODEL_PATH);

export default Desk;
