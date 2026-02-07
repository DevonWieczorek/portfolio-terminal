import { forwardRef, memo, useEffect, useState } from "react";
import { Vector3, Box3, type Group } from "three";
import { useGLTF } from "@react-three/drei";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";

type MonitorProps = Record<string, never>;

type MonitorControls = {
    monitorRotationY: number;
    monitorX: number;
    monitorY: number;
    monitorZ: number;
};

const Monitor = memo(
    forwardRef<Group, MonitorProps>((_props, ref) => {
        const { monitor } = useScene();
        const monitorModel = useGLTF("/models/monitor.glb");
        const [size, setSize] = useState<Vector3>(new Vector3());

        let monitorX, monitorY, monitorZ, monitorRotationY;

        // #if DEBUG
        ({ monitorRotationY, monitorX, monitorY, monitorZ } = useControls(
            "Monitor",
            {
                monitorRotationY: {
                    value: monitor?.rotation?.y ?? 0,
                    min: -5,
                    max: Math.PI * 2,
                    step: 0.01,
                },
                monitorX: {
                    value: monitor?.position?.x ?? 0,
                    min: -20,
                    max: 10,
                    step: 0.1,
                },
                monitorY: {
                    value: monitor?.position?.y ?? 0,
                    min: -10,
                    max: 10,
                    step: 0.1,
                },
                monitorZ: {
                    value: monitor?.position?.z ?? 0,
                    min: -20,
                    max: 10,
                    step: 0.1,
                },
            },
            { collapsed: true }
        ) as MonitorControls);
        // #endif

        // #if !DEBUG
        monitorRotationY = monitor?.rotation?.y;
        monitorX = monitor?.position?.x;
        monitorY = monitor?.position?.y;
        monitorZ = monitor?.position?.z;
        // #endif

        useEffect(() => {
            if (monitorModel?.scene) {
                setSize(
                    new Box3()
                        .setFromObject(monitorModel.scene)
                        .getSize(new Vector3())
                );
            }
        }, [monitorModel?.scene]);

        return (
            <group
                ref={ref}
                position={[monitorX, monitorY, monitorZ]}
                rotation={[0, monitorRotationY, 0]}
            >
                <primitive
                    object={monitorModel.scene}
                    position={[0, 0, 0]}
                    rotation={[0, 0, 0]}
                />
                {/* Collision for monitor */}
                <mesh visible={false}>
                    <boxGeometry args={[size.x, size.y, size.z]} />
                </mesh>
            </group>
        );
    })
);
Monitor.displayName = "Monitor";

useGLTF.preload("/models/monitor.glb");

export default Monitor;
