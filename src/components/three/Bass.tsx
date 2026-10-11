import { memo, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { getBackOffset, getModelDimensions } from "@/utils/three";

interface BassProps {
    position: Coordinate;
    scale?: Coordinate;
    modelPath?: string;
    bodyColor?: THREE.ColorRepresentation;
    pickguardColor?: THREE.ColorRepresentation;
}

const DEFAULT_MODEL = "/models/bass-guitar-configurable.glb";
// Names of the materials in the configurable model that can be recolored
const BODY_MATERIAL_NAME = "body_paint";
const PICKGUARD_MATERIAL_NAME = "tortoise";
// Height of the model in its own units. Normalizing to 1 lets the `scale` prop
// represent the bass's height in scene units.
const MODEL_HEIGHT = 1.147;

const Bass = memo(
    ({
        position,
        scale = [1, 1, 1],
        modelPath = DEFAULT_MODEL,
        bodyColor,
        pickguardColor,
    }: BassProps) => {
        const { scene } = useGLTF(modelPath);

        // #if DEBUG
        useEffect(() => {
            getModelDimensions(modelPath);
        }, [modelPath]);
        // #endif

        // Clone the scene so multiple instances can exist in the scene graph.
        // Materials are shared between clones, so each recolored material is
        // cloned per instance before changing its color.
        const clonedScene = useMemo(() => {
            const clone = scene.clone(true);
            const colorsByMaterial: Record<
                string,
                THREE.ColorRepresentation | undefined
            > = {
                [BODY_MATERIAL_NAME]: bodyColor,
                [PICKGUARD_MATERIAL_NAME]: pickguardColor,
            };
            const recolored = new Map<string, THREE.MeshStandardMaterial>();

            clone.traverse(child => {
                if (!(child instanceof THREE.Mesh)) return;
                const material = child.material as THREE.MeshStandardMaterial;
                const color = colorsByMaterial[material.name];
                if (color === undefined) return;

                let replacement = recolored.get(material.name);
                if (!replacement) {
                    replacement = material.clone();
                    replacement.color.set(color);
                    recolored.set(material.name, replacement);
                }
                child.material = replacement;
            });
            return clone;
        }, [scene, bodyColor, pickguardColor]);
        const backOffset = useMemo(
            () => getBackOffset(clonedScene),
            [clonedScene]
        );
        const normalizedScale = useMemo(
            () => scale.map(s => s / MODEL_HEIGHT) as Coordinate,
            [scale]
        );

        // Shift forward so the back of the bass sits on the parent's z = 0
        const [x, y, z] = position;
        return (
            <primitive
                object={clonedScene}
                position={[x, y, z + backOffset * normalizedScale[2]]}
                scale={normalizedScale}
            />
        );
    }
);
Bass.displayName = "Bass";

export default Bass;
