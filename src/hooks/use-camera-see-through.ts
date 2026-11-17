import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useExperience } from "@/lib/stores/useExperience";

const FADE_RATE = 12;
const HIDDEN_OPACITY = 0.01;

// Distance on the floor plane from (px, pz) to the segment a -> b
const distanceToSegmentXZ = (
    px: number,
    pz: number,
    a: THREE.Vector3,
    bx: number,
    bz: number
) => {
    const dx = bx - a.x;
    const dz = bz - a.z;
    const lengthSq = dx * dx + dz * dz;
    const t =
        lengthSq === 0
            ? 0
            : THREE.MathUtils.clamp(
                  ((px - a.x) * dx + (pz - a.z) * dz) / lengthSq,
                  0,
                  1
              );
    return Math.hypot(px - (a.x + t * dx), pz - (a.z + t * dz));
};

// Fades `groupRef` out while it stands between the camera and a camera
// override's target (the terminal or an inspect view), so it never blocks
// the shot, and fades it back in once the camera returns to the scene
export function useCameraSeeThrough(
    groupRef: RefObject<THREE.Object3D | null>,
    radius: number
) {
    const materials = useRef<THREE.Material[] | null>(null);
    const opacity = useRef(1);
    const worldPosition = useMemo(() => new THREE.Vector3(), []);

    useFrame(({ camera }, delta) => {
        const group = groupRef.current;
        if (!group) return;

        const { cameraOverride, targetMode } = useExperience.getState();
        let targetOpacity = 1;

        // Matches when Camera holds the override, so the character starts
        // fading back in the moment the camera turns back toward it
        if (cameraOverride && targetMode !== "scene") {
            group.getWorldPosition(worldPosition);
            const [lookX, , lookZ] = cameraOverride.lookAt;
            const distance = distanceToSegmentXZ(
                worldPosition.x,
                worldPosition.z,
                camera.position,
                lookX,
                lookZ
            );
            if (distance < radius) {
                targetOpacity = 0;
            }
        }

        if (opacity.current === targetOpacity) return;

        if (!materials.current) {
            const found: THREE.Material[] = [];
            group.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    const material = child.material as THREE.Material;
                    if (
                        material instanceof THREE.MeshStandardMaterial &&
                        !found.includes(material)
                    ) {
                        found.push(material);
                    }
                }
            });
            materials.current = found;
        }

        opacity.current = THREE.MathUtils.damp(
            opacity.current,
            targetOpacity,
            FADE_RATE,
            delta
        );
        if (Math.abs(opacity.current - targetOpacity) < HIDDEN_OPACITY) {
            opacity.current = targetOpacity;
        }

        const isOpaque = opacity.current === 1;
        for (const material of materials.current) {
            if (material.transparent === isOpaque) {
                material.transparent = !isOpaque;
                material.needsUpdate = true;
            }
            material.opacity = opacity.current;
        }
        // Fully faded out, so stop drawing it and its shadow altogether
        group.visible = opacity.current > 0;
    });
}
