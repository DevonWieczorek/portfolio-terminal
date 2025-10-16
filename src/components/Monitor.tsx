import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Vector3, Box3, Quaternion, Group } from "three";
import { useGLTF } from "@react-three/drei";
import { useControls, folder } from "leva";
import { useScene } from "@/lib/contexts/SceneContext";
import InteractiveBox from "@/components/InteractiveBox";
import { useExperience } from "@/lib/stores/useExperience";

interface MonitorProps {
        proximityPosition: PositionArray;
}

type MonitorType = (props: MonitorProps) => JSX.Element;

interface ControlValue {
        [key: string]: number;
}

interface ControlValues {
        [key: string]: ControlValue;
}

const MONITOR_MESSAGE = "Press ENTER to use the computer.";

const Monitor: MonitorType = ({ proximityPosition }) => {
        const { monitor } = useScene();
        const monitorModel = useGLTF("/models/monitor.glb");
        const [size, setSize] = useState<Vector3>(new Vector3());
        const sizeRef = useRef<Vector3>(size);
        const worldPosition = useMemo(() => new Vector3(), []);
        const worldDirection = useMemo(() => new Vector3(), []);
        const worldUp = useMemo(() => new Vector3(0, 1, 0), []);
        const worldQuaternion = useMemo(() => new Quaternion(), []);
        const requestExperience = useExperience(state => state.requestExperience);
        const setMonitorTransform = useExperience(state => state.setMonitorTransform);
        const target = useExperience(state => state.target);

        const controls: ControlValues = useControls({
                Monitor: folder({
                        monitorRotationY: {
                                value: monitor?.rotation?.y,
                                min: -5,
                                max: Math.PI * 2,
                                step: 0.01,
                        },
                        monitorX: {
                                value: monitor?.position?.x,
                                min: -20,
                                max: 10,
                                step: 0.1,
                        },
                        monitorY: {
                                value: monitor?.position?.y,
                                min: -10,
                                max: 10,
                                step: 0.1,
                        },
                        monitorZ: {
                                value: monitor?.position?.z,
                                min: -20,
                                max: 10,
                                step: 0.1,
                        },
                } as any), // TODO: Fix type
        });

        const { monitorRotationY, monitorX, monitorY, monitorZ } = controls;

        useEffect(() => {
                if (monitorModel?.scene) {
                        setSize(new Box3().setFromObject(monitorModel.scene).getSize(new Vector3()));
                }
        }, [monitorModel?.scene]);

        useEffect(() => {
                sizeRef.current = size;
        }, [size]);

        const handleInteract = useCallback(() => {
                if (target === "terminal") {
                        return;
                }

                requestExperience("terminal");
        }, [requestExperience, target]);

        const handleFrame = useCallback(
                (group: Group) => {
                        group.getWorldPosition(worldPosition);
                        group.getWorldDirection(worldDirection);
                        group.getWorldQuaternion(worldQuaternion);

                        worldUp.set(0, 1, 0).applyQuaternion(worldQuaternion);

                        const monitorSize = sizeRef.current;

                        setMonitorTransform({
                                position: [worldPosition.x, worldPosition.y, worldPosition.z],
                                direction: [worldDirection.x, worldDirection.y, worldDirection.z],
                                up: [worldUp.x, worldUp.y, worldUp.z],
                                size: [
                                        monitorSize.x || 1,
                                        monitorSize.y || 1,
                                        monitorSize.z || 1,
                                ],
                        });
                },
                [setMonitorTransform, worldDirection, worldPosition, worldQuaternion, worldUp],
        );

        return (
                <InteractiveBox
                        message={MONITOR_MESSAGE}
                        position={[monitorX, monitorY, monitorZ]}
                        rotation={[0, monitorRotationY, 0]}
                        proximityPosition={proximityPosition}
                        onInteract={handleInteract}
                        onFrame={handleFrame}
                >
                        <primitive object={monitorModel.scene} position={[0, 0, 0]} rotation={[0, 0, 0]} />
                        {/* Collision for monitor */}
                        <mesh visible={false}>
                                <boxGeometry args={[size.x, size.y, size.z]} />
                        </mesh>
                </InteractiveBox>
        );
};

export default Monitor;
useGLTF.preload("/models/monitor.glb");
