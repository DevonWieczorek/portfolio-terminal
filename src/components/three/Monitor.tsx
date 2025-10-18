import { useCallback, useEffect, useState } from "react";
import { Vector3, Box3, type Quaternion } from "three";
import { useGLTF } from "@react-three/drei";
import { useControls, folder } from "leva";
import { useScene } from "@/lib/contexts/SceneContext";
import InteractiveBox from "@/components/three/InteractiveBox";
import { useExperience } from "@/lib/stores/useExperience";
import type { CameraTarget } from "@/lib/stores/useExperience";

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
        const enterTerminal = useExperience(state => state.enterTerminal);

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
                } as any, { collapsed: true }), // TODO: Fix type
        });

        const { monitorRotationY, monitorX, monitorY, monitorZ } = controls;

        useEffect(() => {
                if (monitorModel?.scene) {
                        setSize(new Box3().setFromObject(monitorModel.scene).getSize(new Vector3()));
                }
        }, [monitorModel?.scene]);

        const computeCameraTarget = useCallback(({ worldPosition, worldQuaternion }: { worldPosition: Vector3; worldQuaternion: Quaternion }) => {
                const forward = new Vector3(0, 0, -1).applyQuaternion(worldQuaternion).normalize();
                const up = new Vector3(0, 1, 0).applyQuaternion(worldQuaternion).normalize();

                const cameraPosition = worldPosition
                        .clone()
                        .add(forward.clone().multiplyScalar(3.25))
                        .add(up.clone().multiplyScalar(1.4));

                const lookAtPosition = worldPosition.clone().add(up.clone().multiplyScalar(0.9));

                return {
                        position: [cameraPosition.x, cameraPosition.y, cameraPosition.z],
                        lookAt: [lookAtPosition.x, lookAtPosition.y, lookAtPosition.z],
                } satisfies CameraTarget;
        }, []);

        const handleEnter = useCallback(
                (target?: CameraTarget) => {
                        if (!target) {
                                return;
                        }

                        enterTerminal(target);
                },
                [enterTerminal],
        );

        return (
                <InteractiveBox
                        message={MONITOR_MESSAGE}
                        position={[monitorX, monitorY, monitorZ]}
                        rotation={[0, monitorRotationY, 0]}
                        proximityPosition={proximityPosition}
                        onEnter={handleEnter}
                        computeCameraTarget={computeCameraTarget}
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
