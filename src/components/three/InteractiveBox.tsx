import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    type ReactNode,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, Quaternion, Vector3 } from "three";
import { useMessage } from "@/lib/contexts/MessageContext";
import type { CameraTarget } from "@/lib/stores/useExperience";

interface InteractiveBoxProps {
    children: ReactNode;
    message: string;
    triggerDistance?: number;
    proximityPosition?: PositionArray;
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    onEnter?: (target?: CameraTarget) => void;
    computeCameraTarget?: (
        params: ComputeCameraTargetParams
    ) => CameraTarget | undefined;
}

interface ComputeCameraTargetParams {
    group: Group;
    worldPosition: Vector3;
    worldQuaternion: Quaternion;
}

const InteractiveBox = React.memo(function InteractiveBox({
    children,
    message,
    triggerDistance = 3,
    proximityPosition,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
    onEnter,
    computeCameraTarget,
}: InteractiveBoxProps) {
    const groupRef = useRef<Group>(null);
    const { camera } = useThree();
    const { message: activeMessage, setMessage, clearMessage } = useMessage();
    const worldPosition = useMemo(() => new Vector3(), []);
    const worldQuaternion = useMemo(() => new Quaternion(), []);
    const proximityVector = useMemo(() => new Vector3(), []);
    const hasActiveMessageRef = useRef(false);
    const lastTargetRef = useRef<CameraTarget | undefined>(undefined);

    const resolveCameraTarget = useCallback(() => {
        const group = groupRef.current;

        if (!group || !computeCameraTarget) {
            return undefined;
        }

        group.getWorldPosition(worldPosition);
        group.getWorldQuaternion(worldQuaternion);

        return computeCameraTarget({
            group,
            worldPosition: worldPosition.clone(),
            worldQuaternion: worldQuaternion.clone(),
        });
    }, [computeCameraTarget, worldPosition, worldQuaternion]);

    useFrame(() => {
        const group = groupRef.current;

        if (!group) {
            return;
        }

        const targetPosition = proximityPosition
            ? proximityPosition instanceof Vector3
                ? proximityPosition
                : proximityVector.set(...proximityPosition)
            : camera.position;

        group.getWorldPosition(worldPosition);

        const distance = targetPosition.distanceTo(worldPosition);
        const shouldShow = distance < triggerDistance;

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
        } else if (hasActiveMessageRef.current) {
            if (activeMessage === message) {
                clearMessage();
            }
            hasActiveMessageRef.current = false;
        }
    });

    useEffect(() => {
        return () => {
            if (hasActiveMessageRef.current && activeMessage === message) {
                clearMessage();
            }
        };
    }, [activeMessage, clearMessage, message]);

    return (
        <group
            ref={groupRef}
            position={position}
            rotation={rotation}
            scale={scale}
        >
            {children}
        </group>
    );
});
InteractiveBox.displayName = "InteractiveBox";

export default InteractiveBox;
