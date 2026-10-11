import { memo, useMemo } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";

interface SkateboardProps {
    position: Coordinate;
    graphicPath: string;
    scale?: Coordinate;
    modelPath?: string;
}

const DEFAULT_MODEL = "/models/brew-crew-deck-configurable.glb";
// Name of the material in the configurable model that holds the bottom graphic
const GRAPHIC_MATERIAL_NAME = "graphic";
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
        graphicPath,
        scale = [1, 1, 1],
        modelPath = DEFAULT_MODEL,
    }: SkateboardProps) => {
        const { scene } = useGLTF(modelPath);
        const graphicTexture = useTexture(graphicPath);

        // Clone the scene so multiple instances can exist in the scene graph.
        // Materials are shared between clones, so the graphic material is
        // cloned per instance before swapping its texture.
        const clonedScene = useMemo(() => {
            // glTF UVs expect textures that are not flipped vertically
            graphicTexture.flipY = false;
            graphicTexture.colorSpace = THREE.SRGBColorSpace;
            graphicTexture.anisotropy = 8;
            graphicTexture.needsUpdate = true;

            const clone = scene.clone(true);
            let graphicMaterial: THREE.MeshStandardMaterial | undefined;
            clone.traverse(child => {
                if (!(child instanceof THREE.Mesh)) return;
                const material = child.material as THREE.Material;
                if (material.name !== GRAPHIC_MATERIAL_NAME) return;

                if (!graphicMaterial) {
                    graphicMaterial = (
                        material as THREE.MeshStandardMaterial
                    ).clone();
                    graphicMaterial.map = graphicTexture;
                }
                child.material = graphicMaterial;
            });
            return clone;
        }, [scene, graphicTexture]);
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
