import { useMemo, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Matrix4, Quaternion, Vector3, type Object3D } from "three";
import type { RapierCollider } from "@react-three/rapier";

/**
 * Rapier places a standalone collider from its scene-graph transform once,
 * when the collider is created, and doesn't watch its three.js parents after
 * that. Leva moves those parents at runtime, so this re-places the collider
 * whenever `object`'s world transform changes. Scale isn't followed: size
 * colliders through their `args` instead.
 */
export function useColliderFollow(
    colliderRef: RefObject<RapierCollider | null>,
    objectRef: RefObject<Object3D | null>
) {
    const lastMatrix = useMemo(() => new Matrix4(), []);
    const position = useMemo(() => new Vector3(), []);
    const rotation = useMemo(() => new Quaternion(), []);
    const scale = useMemo(() => new Vector3(), []);

    useFrame(() => {
        const collider = colliderRef.current;
        const object = objectRef.current;

        if (!collider || !object || object.matrixWorld.equals(lastMatrix)) {
            return;
        }

        lastMatrix.copy(object.matrixWorld);
        object.matrixWorld.decompose(position, rotation, scale);
        collider.setTranslation(position);
        collider.setRotation(rotation);
    });
}
