import { memo, useEffect, useState } from "react";
import { Vector3, Box3 } from "three";
import { useGLTF } from "@react-three/drei";

type MonitorProps = {
    position: [number, number, number];
    rotationY: number;
};

const Monitor = memo(({ position, rotationY }: MonitorProps) => {
    const monitorModel = useGLTF("/models/monitor.glb");
    const [size, setSize] = useState<Vector3>(new Vector3());

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
        <group position={position} rotation={[0, rotationY, 0]}>
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
});
Monitor.displayName = "Monitor";

useGLTF.preload("/models/monitor.glb");

export default Monitor;
