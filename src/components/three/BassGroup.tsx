import { memo, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";
import Bass from "@/components/three/Bass";
import InteractiveBox from "@/components/three/InteractiveBox";

type BassControls = {
    bassX: number;
    bassY: number;
    bassZ: number;
    bassScale: number;
    bassSpacing: number;
    proximityX: number;
    proximityY: number;
    proximityZ: number;
};

const NUM_BASSES = 4;
// Subtracting 1.5 from i ensures the group of 4 basses is centered on bassX, not offset to one side.
const GROUP_CENTER_OFFSET = (NUM_BASSES - 1) / 2;
const BASS_MESSAGE =
    "Devon is the bassist and co-vocalist of an alternative Punk Rock band called Friend Z.";

// Static bass configurations - moved outside component to prevent recreation
const BASS_CONFIGS = [
    { src: "/models/bass-1.glb" },
    { src: "/models/bass-2.glb", scale: 1.28 },
    { src: "/models/bass-3.glb", scale: 27.22 },
    // { src: "/models/bass-4.glb", scale: 0.094 },
    { src: "/models/bass-1.glb" },
];

const BassGroup = memo(
    ({ proximityPosition }: { proximityPosition: PositionArray }) => {
        const { bass } = useScene();

        let bassX, bassY, bassZ, bassScale, bassSpacing;
        let proximityX, proximityY, proximityZ;

        // #if DEBUG
        ({ bassX, bassY, bassZ, bassScale, bassSpacing } = useControls(
            "Bass",
            {
                bassX: {
                    value: bass?.position?.x ?? 0,
                    min: -20,
                    max: 10,
                    step: 0.01,
                },
                bassY: {
                    value: bass?.position?.y ?? 0,
                    min: -10,
                    max: 10,
                    step: 0.01,
                },
                bassZ: {
                    value: bass?.position?.z ?? 0,
                    min: -20,
                    max: 10,
                    step: 0.01,
                },
                bassScale: {
                    value: bass?.scale ?? 0,
                    min: 0.1,
                    max: 10,
                    step: 0.1,
                },
                bassSpacing: {
                    value: bass?.spacing ?? 0,
                    min: 0.5,
                    max: 5,
                    step: 0.1,
                },
                proximityX: {
                    value: bass?.position?.x ?? 0,
                    min: -20,
                    max: 10,
                    step: 0.01,
                },
                proximityY: {
                    value: 0,
                    min: -10,
                    max: 10,
                    step: 0.01,
                },
                proximityZ: {
                    value: bass?.position?.z ?? 0,
                    min: -20,
                    max: 10,
                    step: 0.01,
                },
            },
            { collapsed: true }
        ) as BassControls);
        // #endif

        // #if !DEBUG
        bassX = bass?.position?.x;
        bassY = bass?.position?.y;
        bassZ = bass?.position?.z;
        bassScale = bass?.scale;
        bassSpacing = bass?.spacing;
        proximityX = bass?.position?.x;
        proximityY = 0;
        proximityZ = bass?.position?.z;
        // #endif

        const BassElements = useMemo(
            () =>
                Array.from({ length: NUM_BASSES }).map((_, i) => {
                    const config = BASS_CONFIGS[i];
                    const scale =
                        config.scale !== undefined
                            ? ([config.scale, config.scale, config.scale] as [
                                  number,
                                  number,
                                  number,
                              ])
                            : ([bassScale, bassScale, bassScale] as [
                                  number,
                                  number,
                                  number,
                              ]);

                    return (
                        <Bass
                            key={i}
                            position={[
                                (i - GROUP_CENTER_OFFSET) * bassSpacing,
                                bassY,
                                0,
                            ]}
                            scale={scale}
                            modelPath={config.src}
                        />
                    );
                }),
            [bassSpacing, bassY, bassScale]
        );

        return (
            <InteractiveBox
                message={BASS_MESSAGE}
                position={[proximityX, proximityY, proximityZ]}
                proximityPosition={proximityPosition}
            >
                <group
                    position={[
                        bassX - proximityX,
                        -proximityY,
                        bassZ - proximityZ,
                    ]}
                >
                    {BassElements}
                </group>
            </InteractiveBox>
        );
    }
);
BassGroup.displayName = "BassGroup";

useGLTF.preload("/models/bass-1.glb");
useGLTF.preload("/models/bass-2.glb");
useGLTF.preload("/models/bass-3.glb");
useGLTF.preload("/models/bass-4.glb");
export default BassGroup;
