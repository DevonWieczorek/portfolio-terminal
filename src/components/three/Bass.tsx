import { memo, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { getModelDimensions } from "@/utils/three";

interface BassProps {
    position: Coordinate;
    scale?: Coordinate;
    modelPath?: string;
    bodyColor?: THREE.ColorRepresentation;
}

const DEFAULT_MODEL = "/models/bass-guitar-configurable.glb";
// Name of the material in the configurable model that controls the body finish
const BODY_MATERIAL_NAME = "body_paint";

const Bass = memo(
    ({
        position,
        scale = [1, 1, 1],
        modelPath = DEFAULT_MODEL,
        bodyColor,
    }: BassProps) => {
        const { scene } = useGLTF(modelPath);

        // #if DEBUG
        useEffect(() => {
            getModelDimensions(modelPath);
        }, [modelPath]);
        // #endif

        // Clone the scene so multiple instances can exist in the scene graph.
        // Materials are shared between clones, so the body material is cloned
        // per instance before recoloring it.
        const clonedScene = useMemo(() => {
            const clone = scene.clone(true);
            if (bodyColor === undefined) return clone;

            let bodyMaterial: THREE.MeshStandardMaterial | undefined;
            clone.traverse(child => {
                if (!(child instanceof THREE.Mesh)) return;
                const material = child.material as THREE.Material;
                if (material.name !== BODY_MATERIAL_NAME) return;

                if (!bodyMaterial) {
                    bodyMaterial = (
                        material as THREE.MeshStandardMaterial
                    ).clone();
                    bodyMaterial.color.set(bodyColor);
                }
                child.material = bodyMaterial;
            });
            return clone;
        }, [scene, bodyColor]);

        return (
            <primitive object={clonedScene} position={position} scale={scale} />
        );
    }
);
Bass.displayName = "Bass";

export default Bass;
