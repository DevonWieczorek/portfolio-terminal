import { memo, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { getModelDimensions } from "@/utils/three";

interface BassProps {
    position: Coordinate;
    scale?: Coordinate;
    modelPath?: string;
}

const DEFAULT_MODEL = "/models/bass-1.glb";

const Bass = memo(
    ({ position, scale = [1, 1, 1], modelPath = DEFAULT_MODEL }: BassProps) => {
        const { scene } = useGLTF(modelPath);

        // #if DEBUG
        useEffect(() => {
            getModelDimensions(modelPath);
        }, [modelPath]);
        // #endif

        // Clone the scene so multiple instances can exist in the scene graph
        const clonedScene = useMemo(() => scene.clone(true), [scene]);

        return (
            <primitive object={clonedScene} position={position} scale={scale} />
        );
    }
);
Bass.displayName = "Bass";

export default Bass;
