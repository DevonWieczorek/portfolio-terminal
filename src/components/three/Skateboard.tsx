import { memo, useMemo } from "react";
import { useGLTF } from "@react-three/drei";

interface SkateboardProps {
    position: [number, number, number];
    scale?: [number, number, number];
    modelPath?: string;
}

const DEFAULT_MODEL = "/models/skateboard_deck_2.glb";

const Skateboard = memo(
    ({
        position,
        scale = [1, 1, 1],
        modelPath = DEFAULT_MODEL,
    }: SkateboardProps) => {
        const { scene } = useGLTF(modelPath);

        // Clone the scene so multiple instances can exist in the scene graph
        const clonedScene = useMemo(() => scene.clone(true), [scene]);

        return (
            <primitive object={clonedScene} position={position} scale={scale} />
        );
    }
);
Skateboard.displayName = "Skateboard";

export default Skateboard;
