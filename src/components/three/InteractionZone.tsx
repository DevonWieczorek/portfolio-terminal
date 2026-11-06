import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    CuboidCollider,
    useRapier,
    type RapierCollider,
} from "@react-three/rapier";
import { Quaternion, type Group } from "three";
// #if DEBUG
import { useColliderFollow } from "@/hooks/use-collider-follow";
// #endif
import { useMessage } from "@/lib/contexts/MessageContext";
import { useExperience, type CameraTarget } from "@/lib/stores/useExperience";
import { INTERACTION_GROUPS } from "@/lib/constants/physics";

export interface ComputeCameraTargetParams {
    // Shares the transform of the zone's parent
    group: Group;
    worldQuaternion: Quaternion;
}

interface InteractionZoneProps {
    message: string;
    // Box in the parent's local space
    size: Coordinate;
    center: Coordinate;
    onEnter?: (target?: CameraTarget) => void;
    computeCameraTarget?: (
        params: ComputeCameraTargetParams
    ) => CameraTarget | undefined;
}

// #if DEBUG
const DEBUG_IDLE_COLOR = "#8b5cf6";
const DEBUG_ACTIVE_COLOR = "#22c55e";
// #endif

// Sensor volume that shows `message` while the character stands inside it.
// Rapier reports enter/exit events, so nothing runs per frame.
const InteractionZone = memo(function InteractionZone({
    message,
    size,
    center,
    onEnter,
    computeCameraTarget,
}: InteractionZoneProps) {
    const originRef = useRef<Group>(null);
    const zoneRef = useRef<Group>(null);
    const colliderRef = useRef<RapierCollider>(null);
    const { rapier } = useRapier();
    const { message: activeMessage, setMessage, clearMessage } = useMessage();
    const mode = useExperience(state => state.mode);
    const isTransitioning = useExperience(state => state.isTransitioning);
    const [isInside, setIsInside] = useState(false);
    const worldQuaternion = useMemo(() => new Quaternion(), []);

    // #if DEBUG
    useColliderFollow(colliderRef, zoneRef);
    // #endif

    // The message keeps the interaction it was shown with, so read the
    // latest callbacks through a ref instead of re-showing it on every change
    const handlersRef = useRef({ onEnter, computeCameraTarget });
    useEffect(() => {
        handlersRef.current = { onEnter, computeCameraTarget };
    }, [onEnter, computeCameraTarget]);

    const hasOnEnter = Boolean(onEnter);
    const interaction = useMemo(() => {
        if (!hasOnEnter) {
            return null;
        }

        return {
            onEnter: () => {
                const origin = originRef.current;
                const handlers = handlersRef.current;

                if (!origin || !handlers.computeCameraTarget) {
                    handlers.onEnter?.();
                    return;
                }

                origin.getWorldQuaternion(worldQuaternion);
                handlers.onEnter?.(
                    handlers.computeCameraTarget({
                        group: origin,
                        worldQuaternion,
                    })
                );
            },
        };
    }, [hasOnEnter, worldQuaternion]);

    const shouldShow = isInside && mode === "scene" && !isTransitioning;
    const isMessageFree = activeMessage === "";

    // Shows on entering and clears on leaving, but only if this zone's
    // message is still up, so overlapping zones hand off instead of fighting.
    // Re-runs after the terminal closes while the character is still inside.
    useEffect(() => {
        if (!shouldShow) {
            return;
        }

        setMessage(message, interaction);
        return () => clearMessage(message);
    }, [clearMessage, interaction, message, setMessage, shouldShow]);

    // Takes the message back when an overlapping zone gives it up. Only an
    // empty message is claimed, so two zones can't keep replacing each other.
    useEffect(() => {
        if (shouldShow && isMessageFree) {
            setMessage(message, interaction);
        }
    }, [interaction, isMessageFree, message, setMessage, shouldShow]);

    // Collision groups already limit this sensor to the character
    const handleIntersectionEnter = useCallback(() => setIsInside(true), []);
    const handleIntersectionExit = useCallback(() => setIsInside(false), []);

    let debugMesh = null;
    // #if DEBUG
    debugMesh = (
        <mesh>
            <boxGeometry args={size} />
            <meshBasicMaterial
                color={isInside ? DEBUG_ACTIVE_COLOR : DEBUG_IDLE_COLOR}
                transparent
                opacity={0.2}
                depthWrite={false}
            />
        </mesh>
    );
    // #endif

    return (
        <group ref={originRef}>
            <group ref={zoneRef} position={center}>
                <CuboidCollider
                    ref={colliderRef}
                    args={[size[0] / 2, size[1] / 2, size[2] / 2]}
                    sensor
                    collisionGroups={INTERACTION_GROUPS}
                    // Rapier skips kinematic-vs-fixed pairs by default, and
                    // the character is kinematic while this zone is fixed
                    activeCollisionTypes={
                        rapier.ActiveCollisionTypes.DEFAULT |
                        rapier.ActiveCollisionTypes.KINEMATIC_FIXED
                    }
                    onIntersectionEnter={handleIntersectionEnter}
                    onIntersectionExit={handleIntersectionExit}
                />
                {debugMesh}
            </group>
        </group>
    );
});
InteractionZone.displayName = "InteractionZone";

export default InteractionZone;
