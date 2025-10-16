import { useEffect, useState } from "react";
import { Vector3, Box3 } from "three";
import { useGLTF } from "@react-three/drei";
import { useControls, folder } from "leva";
import { useScene } from "@/lib/contexts/SceneContext";
import InteractiveBox from "@/components/InteractiveBox";

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

        return (
                <InteractiveBox
                        message={MONITOR_MESSAGE}
                        position={[monitorX, monitorY, monitorZ]}
                        rotation={[0, monitorRotationY, 0]}
                        proximityPosition={proximityPosition}
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
