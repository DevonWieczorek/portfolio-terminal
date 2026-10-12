import { useEffect, useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

type SurfaceTexturePaths = {
    map: string;
    normalMap?: string;
    roughnessMap?: string;
};

export type SurfaceTextures = {
    map: THREE.Texture;
    normalMap?: THREE.Texture;
    roughnessMap?: THREE.Texture;
};

// Loads a surface's textures and tiles them `repeatX` x `repeatY` times
// across each face of the mesh they are applied to
export function useSurfaceTextures(
    paths: SurfaceTexturePaths,
    repeatX: number,
    repeatY: number
): SurfaceTextures {
    // Skip optional maps that aren't provided so they aren't fetched
    const definedPaths = useMemo(
        () =>
            Object.fromEntries(
                Object.entries(paths).filter(([, path]) => path !== undefined)
            ) as Record<string, string>,
        [paths]
    );
    const textures = useTexture(definedPaths) as SurfaceTextures;

    useEffect(() => {
        Object.values(textures).forEach((texture: THREE.Texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(repeatX, repeatY);
            texture.anisotropy = 8;
            texture.needsUpdate = true;
        });
        // Only the albedo holds color; normal and roughness are linear data
        textures.map.colorSpace = THREE.SRGBColorSpace;
    }, [textures, repeatX, repeatY]);

    return textures;
}
