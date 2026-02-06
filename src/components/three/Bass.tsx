import React, { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { getModelDimensions } from "@/utils/three";

interface BassProps {
    position: [number, number, number];
    scale?: [number, number, number];
    modelPath?: string;
}

const DEFAULT_MODEL = "/models/bass-1.glb";

const Bass = React.memo(
    ({ position, scale = [1, 1, 1], modelPath = DEFAULT_MODEL }: BassProps) => {
        if (process.env.NEXT_PUBLIC_DEBUG) {
            getModelDimensions(modelPath);
        }
        const { scene } = useGLTF(modelPath);

        // Clone the scene so multiple instances can exist in the scene graph
        const clonedScene = useMemo(() => scene.clone(true), [scene]);

        return (
            <primitive object={clonedScene} position={position} scale={scale} />
        );
    }
);
Bass.displayName = "Bass";

export default Bass;
