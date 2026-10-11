import { memo, useMemo } from "react";
import { useGLTF } from "@react-three/drei";

interface SkateboardProps {
    position: Coordinate;
    scale?: Coordinate;
    modelPath?: string;
}

const DEFAULT_MODEL = "/models/brew-crew-deck-configurable.glb";
// The model lies flat (length along Z, grip facing +Y). Stand it upright so the
// length runs along Y and the bottom graphic faces out from the wall (+Z). The
// extra half-turn on Y keeps the graphic right-side up and unmirrored.
const MODEL_ROTATION: Coordinate = [-Math.PI / 2, Math.PI, 0];
// Nose-to-tail length of the model in its own units. Normalizing to 1 lets the
// `scale` prop represent the deck's length in scene units.
const MODEL_LENGTH = 0.769;

const Skateboard = memo(
    ({
        position,
        scale = [1, 1, 1],
        modelPath = DEFAULT_MODEL,
    }: SkateboardProps) => {
        const { scene } = useGLTF(modelPath);

        // Clone the scene so multiple instances can exist in the scene graph
        const clonedScene = useMemo(() => scene.clone(true), [scene]);
        const normalizedScale = useMemo(
            () => scale.map(s => s / MODEL_LENGTH) as Coordinate,
            [scale]
        );

        return (
            <primitive
                object={clonedScene}
                position={position}
                rotation={MODEL_ROTATION}
                scale={normalizedScale}
            />
        );
    }
);
Skateboard.displayName = "Skateboard";

export default Skateboard;
