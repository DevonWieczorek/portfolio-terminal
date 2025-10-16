import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, Vector3 } from "three";
import { useMessage } from "@/lib/contexts/MessageContext";

interface InteractiveBoxProps {
        children: ReactNode;
        message: string;
        triggerDistance?: number;
        proximityPosition?: PositionArray;
        position?: [number, number, number];
        rotation?: [number, number, number];
        scale?: [number, number, number];
        onInteract?: () => void;
        interactKey?: string;
        onFrame?: (group: Group, distance: number) => void;
}

function InteractiveBox({
        children,
        message,
        triggerDistance = 3,
        proximityPosition,
        position = [0, 0, 0],
        rotation = [0, 0, 0],
        scale = [1, 1, 1],
        onInteract,
        interactKey = "Enter",
        onFrame,
}: InteractiveBoxProps) {
        const groupRef = useRef<Group>(null);
        const { camera } = useThree();
        const { message: activeMessage, setMessage, clearMessage } = useMessage();
        const worldPosition = useMemo(() => new Vector3(), []);
        const proximityVector = useMemo(() => new Vector3(), []);
        const hasActiveMessageRef = useRef(false);

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
                                setMessage(message);
                                hasActiveMessageRef.current = true;
                        }
                } else if (hasActiveMessageRef.current) {
                        if (activeMessage === message) {
                                clearMessage();
                        }
                        hasActiveMessageRef.current = false;
                }

                if (onFrame && group) {
                        onFrame(group, distance);
                }
        });

        useEffect(() => {
                return () => {
                        if (hasActiveMessageRef.current && activeMessage === message) {
                                clearMessage();
                        }
                };
        }, [activeMessage, clearMessage, message]);

        useEffect(() => {
                if (!onInteract) {
                        return;
                }

                const handleKeyDown = (event: KeyboardEvent) => {
                        if (event.key !== interactKey) {
                                return;
                        }

                        if (!hasActiveMessageRef.current) {
                                return;
                        }

                        if (activeMessage === message) {
                                clearMessage();
                        }

                        onInteract();
                };

                window.addEventListener("keydown", handleKeyDown);

                return () => {
                        window.removeEventListener("keydown", handleKeyDown);
                };
        }, [activeMessage, clearMessage, interactKey, message, onInteract]);

        return (
                <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
                        {children}
                </group>
        );
}

export default InteractiveBox;
