import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useControls, folder } from "leva";
import { useScene } from "@/lib/contexts/SceneContext";
import Bass from "@/components/three/Bass";
import InteractiveBox from "@/components/three/InteractiveBox";

const NUM_BASSES = 4;
// Subtracting 1.5 from i ensures the group of 4 basses is centered on bassX, not offset to one side.
const GROUP_CENTER_OFFSET = (NUM_BASSES - 1) / 2;
const BASS_MESSAGE =
    "Devon is the bassist and co-vocalist of an alternative Punk Rock band called Friend Z.";

const BassGroup = ({
    proximityPosition,
}: {
    proximityPosition: PositionArray;
}) => {
    const { bass } = useScene();

    const { bassX, bassY, bassZ, bassScale, bassSpacing } = useControls({
        Bass: folder(
            {
                bassX: {
                    value: bass?.position?.x,
                    min: -20,
                    max: 10,
                    step: 0.01,
                },
                bassY: {
                    value: bass?.position?.y,
                    min: -10,
                    max: 10,
                    step: 0.01,
                },
                bassZ: {
                    value: bass?.position?.z,
                    min: -20,
                    max: 10,
                    step: 0.01,
                },
                bassScale: { value: bass?.scale, min: 0.1, max: 10, step: 0.1 },
                bassSpacing: {
                    value: bass?.spacing,
                    min: 0.5,
                    max: 5,
                    step: 0.1,
                },
            },
            { collapsed: true }
        ),
    });

    const bass1 = {
        scale: [bassScale, bassScale, bassScale],
        src: "/models/bass-1.glb",
    };

    const bass2 = {
        scale: [1.28, 1.28, 1.28],
        src: "/models/bass-2.glb",
    };

    const bass3 = {
        scale: [27.22, 27.22, 27.22],
        src: "/models/bass-3.glb",
    };

    const bass4 = {
        scale: [0.094, 0.094, 0.094],
        src: "/models/bass-4.glb",
    };

    const basses = [bass1, bass2, bass3, bass1];

    const BassElements = useMemo(
        () =>
            Array.from({ length: NUM_BASSES }).map((_, i) => (
                <Bass
                    key={i}
                    position={[
                        (i - GROUP_CENTER_OFFSET) * bassSpacing,
                        bassY,
                        0,
                    ]}
                    scale={basses[i].scale}
                    modelPath={basses[i].src}
                />
            )),
        [NUM_BASSES, GROUP_CENTER_OFFSET, bassSpacing, bassY, basses] // Stable deps only
    );

    return (
        <InteractiveBox
            message={BASS_MESSAGE}
            position={[bassX, 0, bassZ]}
            proximityPosition={proximityPosition}
        >
            <group>{BassElements}</group>
        </InteractiveBox>
    );
};

useGLTF.preload("/models/bass-1.glb");
useGLTF.preload("/models/bass-2.glb");
useGLTF.preload("/models/bass-3.glb");
useGLTF.preload("/models/bass-4.glb");
export default BassGroup;
