import { memo, useCallback, useEffect, useState, useMemo } from "react";
import { Vector3, Box3, type Quaternion } from "three";
import { useGLTF } from "@react-three/drei";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";
import InteractiveBox from "@/components/three/InteractiveBox";
import { useExperience } from "@/lib/stores/useExperience";
import type { CameraTarget } from "@/lib/stores/useExperience";

interface MonitorProps {
    proximityPosition: PositionArray;
}

type MonitorControls = {
    monitorRotationY: number;
    monitorX: number;
    monitorY: number;
    monitorZ: number;
};

const MONITOR_MESSAGE = "Press ENTER to use the computer.";

const Monitor = memo(({ proximityPosition }: MonitorProps) => {
    const { monitor } = useScene();
    const monitorModel = useGLTF("/models/monitor.glb");
    const [size, setSize] = useState<Vector3>(new Vector3());
    const enterTerminal = useExperience(state => state.enterTerminal);

    // Memoize Vector3 instances to prevent recreation
    const forwardBase = useMemo(() => new Vector3(0, 0, -1), []);
    const upBase = useMemo(() => new Vector3(0, 1, 0), []);

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

    const computeCameraTarget = useCallback(
        ({
            worldPosition,
            worldQuaternion,
        }: {
            worldPosition: Vector3;
            worldQuaternion: Quaternion;
        }) => {
            const forward = forwardBase
                .clone()
                .applyQuaternion(worldQuaternion)
                .normalize();
            const up = upBase
                .clone()
                .applyQuaternion(worldQuaternion)
                .normalize();

            const cameraPosition = worldPosition
                .clone()
                .add(forward.clone().multiplyScalar(3.25))
                .add(up.clone().multiplyScalar(1.4));

            const lookAtPosition = worldPosition
                .clone()
                .add(up.clone().multiplyScalar(0.9));

            return {
                position: [
                    cameraPosition.x,
                    cameraPosition.y,
                    cameraPosition.z,
                ],
                lookAt: [lookAtPosition.x, lookAtPosition.y, lookAtPosition.z],
            } satisfies CameraTarget;
        },
        [forwardBase, upBase]
    );

    const handleEnter = useCallback(
        (target?: CameraTarget) => {
            if (!target) {
                return;
            }

            enterTerminal(target);
        },
        [enterTerminal]
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
            <primitive
                object={monitorModel.scene}
                position={[0, 0, 0]}
                rotation={[0, 0, 0]}
            />
            {/* Collision for monitor */}
            <mesh visible={false}>
                <boxGeometry args={[size.x, size.y, size.z]} />
            </mesh>
        </InteractiveBox>
    );
});
Monitor.displayName = "Monitor";

useGLTF.preload("/models/monitor.glb");

export default Monitor;
