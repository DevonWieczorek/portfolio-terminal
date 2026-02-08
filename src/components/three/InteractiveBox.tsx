import { memo, useCallback, useEffect, useMemo, useRef } from "react";
// #if DEBUG
import { useState } from "react";
// #endif
import { useFrame, useThree } from "@react-three/fiber";
import {
    Box3,
    Group,
    Matrix4,
    Object3D,
    Quaternion,
    Vector3,
    type BufferGeometry,
    type Mesh,
} from "three";
import { useMessage } from "@/lib/contexts/MessageContext";
import type { CameraTarget } from "@/lib/stores/useExperience";

interface InteractiveBoxProps {
    message: string;
    proximityPosition?: PositionArray;
    onEnter?: (target?: CameraTarget) => void;
    computeCameraTarget?: (
        params: ComputeCameraTargetParams
    ) => CameraTarget | undefined;
    padding?: number;
    size?: [number, number, number] | Vector3;
    center?: [number, number, number] | Vector3;
    // #if DEBUG
    onResolvedBounds?: (bounds: InteractiveBounds) => void;
    // #endif
}

interface ComputeCameraTargetParams {
    group: Group;
    worldPosition: Vector3;
    worldQuaternion: Quaternion;
}

export interface InteractiveBounds {
    center: [number, number, number];
    size: [number, number, number];
}

// Small float tolerance used to ignore tiny math jitter.
const EPSILON = 1e-4;

const InteractiveBox = memo(function InteractiveBox({
    message,
    proximityPosition,
    onEnter,
    computeCameraTarget,
    padding = 0,
    size,
    center,
    // #if DEBUG
    onResolvedBounds,
    // #endif
}: InteractiveBoxProps) {
    const selfRef = useRef<Group>(null);
    const targetRef = useRef<Object3D | null>(null);
    const { camera } = useThree();
    const { message: activeMessage, setMessage, clearMessage } = useMessage();

    const worldPosition = useMemo(() => new Vector3(), []);
    const worldQuaternion = useMemo(() => new Quaternion(), []);
    const proximityVector = useMemo(() => new Vector3(), []);
    const localTargetPosition = useMemo(() => new Vector3(), []);
    const localCenterVector = useMemo(() => new Vector3(), []);
    const localSizeVector = useMemo(() => new Vector3(), []);
    const localBounds = useMemo(() => new Box3(), []);
    const parentBounds = useMemo(() => new Box3(), []);
    const candidateBounds = useMemo(() => new Box3(), []);
    const parentInverse = useMemo(() => new Matrix4(), []);

    const hasActiveMessageRef = useRef(false);
    const hasBoundsRef = useRef(false);
    const lastTargetRef = useRef<CameraTarget | undefined>(undefined);
    // #if DEBUG
    const lastBoundsSignatureRef = useRef<string>("");
    // #endif
    const localCenterRef = useRef<Vector3>(new Vector3());
    const localSizeRef = useRef<Vector3>(new Vector3());
    // #if DEBUG
    const [debugCenter, setDebugCenter] = useState<[number, number, number]>([
        0, 0, 0,
    ]);
    const [debugSize, setDebugSize] = useState<[number, number, number]>([
        0, 0, 0,
    ]);
    // #endif
    let debugMesh = null;

    const clearActiveMessage = useCallback(() => {
        if (!hasActiveMessageRef.current) {
            return;
        }

        if (activeMessage === message) {
            clearMessage();
        }

        hasActiveMessageRef.current = false;
    }, [activeMessage, clearMessage, message]);

    const applyResolvedBounds = useCallback(
        (nextCenter: Vector3, nextSize: Vector3, nextHasBounds: boolean) => {
            hasBoundsRef.current = nextHasBounds;

            if (!nextHasBounds) {
                return;
            }

            localCenterRef.current.copy(nextCenter);
            localSizeRef.current.copy(nextSize);

            // #if DEBUG
            if (onResolvedBounds) {
                // Quantized signature prevents repeated callback updates when
                // values only differ by insignificant floating-point drift.
                const signature = [
                    nextCenter.x.toFixed(4),
                    nextCenter.y.toFixed(4),
                    nextCenter.z.toFixed(4),
                    nextSize.x.toFixed(4),
                    nextSize.y.toFixed(4),
                    nextSize.z.toFixed(4),
                ].join(",");

                if (signature !== lastBoundsSignatureRef.current) {
                    lastBoundsSignatureRef.current = signature;
                    onResolvedBounds({
                        center: [nextCenter.x, nextCenter.y, nextCenter.z],
                        size: [nextSize.x, nextSize.y, nextSize.z],
                    });
                }
            }
            // #endif

            // #if DEBUG
            const centerTuple: [number, number, number] = [
                nextCenter.x,
                nextCenter.y,
                nextCenter.z,
            ];
            const sizeTuple: [number, number, number] = [
                nextSize.x,
                nextSize.y,
                nextSize.z,
            ];

            const centerChanged =
                Math.abs(centerTuple[0] - debugCenter[0]) > EPSILON ||
                Math.abs(centerTuple[1] - debugCenter[1]) > EPSILON ||
                Math.abs(centerTuple[2] - debugCenter[2]) > EPSILON;
            const sizeChanged =
                Math.abs(sizeTuple[0] - debugSize[0]) > EPSILON ||
                Math.abs(sizeTuple[1] - debugSize[1]) > EPSILON ||
                Math.abs(sizeTuple[2] - debugSize[2]) > EPSILON;

            if (centerChanged) {
                setDebugCenter(centerTuple);
            }

            if (sizeChanged) {
                setDebugSize(sizeTuple);
            }
            // #endif
        },
        [
            // #if DEBUG
            debugCenter,
            debugSize,
            onResolvedBounds,
            // #endif
        ]
    );

    const resolveVectorProp = useCallback(
        (
            source: [number, number, number] | Vector3 | undefined,
            fallback: Vector3,
            target: Vector3
        ) => {
            if (!source) {
                return target.copy(fallback);
            }

            if (source instanceof Vector3) {
                return target.copy(source);
            }

            return target.set(source[0], source[1], source[2]);
        },
        []
    );

    const computeBoundsFromParent = useCallback(() => {
        const self = selfRef.current;
        const target = targetRef.current;

        if (!self || !target) {
            return false;
        }

        target.updateWorldMatrix(true, true);
        // Convert world-space values back into parent-local space so computed
        // center/size can be used directly by this component.
        parentInverse.copy(target.matrixWorld).invert();
        parentBounds.makeEmpty();

        target.traverse(obj => {
            if (obj === self || self.children.includes(obj)) {
                return;
            }

            const mesh = obj as Mesh;
            const geometry = mesh.geometry as BufferGeometry | undefined;

            if (!mesh.isMesh || !mesh.visible || !geometry) {
                return;
            }

            if (!geometry.boundingBox) {
                geometry.computeBoundingBox();
            }

            if (!geometry.boundingBox) {
                return;
            }

            candidateBounds
                .copy(geometry.boundingBox)
                // Geometry bounds are mesh-local; convert mesh-local -> world
                // and world -> parent-local before unioning into one box.
                .applyMatrix4(mesh.matrixWorld)
                .applyMatrix4(parentInverse);

            parentBounds.union(candidateBounds);
        });

        if (parentBounds.isEmpty()) {
            applyResolvedBounds(localCenterVector, localSizeVector, false);
            return false;
        }

        parentBounds.getCenter(localCenterVector);
        parentBounds.getSize(localSizeVector);

        resolveVectorProp(center, localCenterVector, localCenterVector);
        resolveVectorProp(size, localSizeVector, localSizeVector);

        localSizeVector.set(
            Math.max(localSizeVector.x + padding * 2, 0),
            Math.max(localSizeVector.y + padding * 2, 0),
            Math.max(localSizeVector.z + padding * 2, 0)
        );

        // Treat near-zero dimensions as invalid to avoid degenerate boxes.
        const hasBounds =
            localSizeVector.x > EPSILON &&
            localSizeVector.y > EPSILON &&
            localSizeVector.z > EPSILON;

        applyResolvedBounds(localCenterVector, localSizeVector, hasBounds);

        return hasBounds;
    }, [
        applyResolvedBounds,
        candidateBounds,
        center,
        localCenterVector,
        localSizeVector,
        padding,
        parentBounds,
        parentInverse,
        resolveVectorProp,
        size,
    ]);

    const resolveCameraTarget = useCallback(() => {
        const target = targetRef.current;

        if (!target || !computeCameraTarget || !(target instanceof Group)) {
            return undefined;
        }

        target.getWorldPosition(worldPosition);
        target.getWorldQuaternion(worldQuaternion);

        return computeCameraTarget({
            group: target,
            worldPosition: worldPosition.clone(),
            worldQuaternion: worldQuaternion.clone(),
        });
    }, [computeCameraTarget, worldPosition, worldQuaternion]);

    useEffect(() => {
        hasBoundsRef.current = false;
    }, [padding, center, size]);

    useFrame(() => {
        const self = selfRef.current;

        if (!self) {
            clearActiveMessage();
            return;
        }

        const parent = self.parent;

        if (!parent) {
            targetRef.current = null;
            hasBoundsRef.current = false;
            clearActiveMessage();
            return;
        }

        if (targetRef.current !== parent) {
            targetRef.current = parent;
            hasBoundsRef.current = false;
        }

        if (!hasBoundsRef.current && !computeBoundsFromParent()) {
            clearActiveMessage();
            return;
        }

        const targetPosition = proximityPosition
            ? proximityPosition instanceof Vector3
                ? proximityPosition
                : proximityVector.set(...proximityPosition)
            : camera.position;

        const parentTarget = targetRef.current;

        if (!parentTarget) {
            clearActiveMessage();
            return;
        }

        localTargetPosition.copy(targetPosition);
        parentTarget.worldToLocal(localTargetPosition);

        localBounds.setFromCenterAndSize(
            localCenterRef.current,
            localSizeRef.current
        );

        // Primary rule: full 3D containment.
        const shouldShowByVolume =
            localBounds.containsPoint(localTargetPosition);
        const halfSizeX = localSizeRef.current.x / 2;
        const halfSizeZ = localSizeRef.current.z / 2;
        const minX = localCenterRef.current.x - halfSizeX;
        const maxX = localCenterRef.current.x + halfSizeX;
        const minZ = localCenterRef.current.z - halfSizeZ;
        const maxZ = localCenterRef.current.z + halfSizeZ;
        const shouldShowByFootprint =
            localTargetPosition.x >= minX &&
            localTargetPosition.x <= maxX &&
            localTargetPosition.z >= minZ &&
            localTargetPosition.z <= maxZ;
        // Secondary rule: XZ footprint containment, so interaction still works
        // when character height differs from object center height.
        const shouldShow = shouldShowByVolume || shouldShowByFootprint;

        if (shouldShow) {
            if (!hasActiveMessageRef.current || activeMessage !== message) {
                const target = resolveCameraTarget();
                lastTargetRef.current = target ?? lastTargetRef.current;

                const interaction = onEnter
                    ? {
                          onEnter: () => {
                              onEnter(lastTargetRef.current ?? target);
                          },
                      }
                    : null;

                setMessage(message, interaction ?? null);
                hasActiveMessageRef.current = true;
            }
        } else {
            clearActiveMessage();
        }
    });

    useEffect(() => {
        return () => {
            if (hasActiveMessageRef.current && activeMessage === message) {
                clearMessage();
            }
        };
    }, [activeMessage, clearMessage, message]);

    // #if DEBUG
    debugMesh = (
        <mesh position={debugCenter}>
            <boxGeometry args={debugSize} />
            <meshBasicMaterial color="#8b5cf6" transparent opacity={0.2} />
        </mesh>
    );
    // #endif

    return <group ref={selfRef}>{debugMesh}</group>;
});
InteractiveBox.displayName = "InteractiveBox";

export default InteractiveBox;
