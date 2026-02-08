import { memo, useCallback, useMemo, useRef } from "react";
import { Vector3, type Group, type Quaternion } from "three";
import { useGLTF } from "@react-three/drei";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";
import InteractiveBox from "@/components/three/InteractiveBox";
// #if DEBUG
import type { InteractiveBounds } from "@/components/three/InteractiveBox";
// #endif
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
    monitorBoxSizeX: number;
    monitorBoxSizeY: number;
    monitorBoxSizeZ: number;
    monitorBoxAnchorX: number;
    monitorBoxAnchorY: number;
    monitorBoxAnchorZ: number;
    monitorApproachYawOffset: number;
};

const MONITOR_MESSAGE = "Press ENTER to use the computer.";
const MONITOR_CAMERA_DISTANCE = 3.25;
const MONITOR_CAMERA_HEIGHT = 1.4;
const MONITOR_LOOK_AT_HEIGHT = 0.9;
const MONITOR_APPROACH_YAW_OFFSET = Math.PI / 4;

const Monitor = memo(({ proximityPosition }: MonitorProps) => {
    const { monitor } = useScene();
    const monitorModel = useGLTF("/models/monitor.glb");
    const enterTerminal = useExperience(state => state.enterTerminal);
    // #if DEBUG
    const shouldSeedBoxControlsRef = useRef(true);
    const setControlsRef = useRef<
        ((value: Partial<MonitorControls>) => void) | null
    >(null);
    // #endif

    // Memoize Vector3 instances to prevent recreation
    // Monitor model faces local +Z; using that normal keeps the transition
    // approach straight into the front of the screen.
    const forwardBase = useMemo(() => new Vector3(0, 0, 1), []);
    const upBase = useMemo(() => new Vector3(0, 1, 0), []);
    const forwardWorld = useMemo(() => new Vector3(), []);
    const upWorld = useMemo(() => new Vector3(), []);
    const adjustedForward = useMemo(() => new Vector3(), []);
    const screenCenterWorld = useMemo(() => new Vector3(), []);
    const cameraPosition = useMemo(() => new Vector3(), []);
    const lookAtPosition = useMemo(() => new Vector3(), []);

    let monitorX, monitorY, monitorZ, monitorRotationY;
    let monitorBoxSizeX,
        monitorBoxSizeY,
        monitorBoxSizeZ,
        monitorBoxAnchorX,
        monitorBoxAnchorY,
        monitorBoxAnchorZ,
        monitorApproachYawOffset;
    let monitorInteractiveSize: Coordinate | undefined = undefined;
    let monitorInteractiveCenter: Coordinate | undefined = undefined;

    // #if DEBUG
    const [monitorControls, setMonitorControls] = useControls(
        "Monitor",
        () => ({
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
            monitorBoxSizeX: {
                value: monitor?.boxSize?.x ?? 5,
                min: 0.1,
                max: 30,
                step: 0.01,
            },
            monitorBoxSizeY: {
                value: monitor?.boxSize?.y ?? 2,
                min: 0.1,
                max: 30,
                step: 0.01,
            },
            monitorBoxSizeZ: {
                value: monitor?.boxSize?.z ?? 3,
                min: 0.1,
                max: 30,
                step: 0.01,
            },
            monitorBoxAnchorX: {
                value: monitor?.boxAnchor?.x ?? 0,
                min: -20,
                max: 20,
                step: 0.01,
            },
            monitorBoxAnchorY: {
                value: monitor?.boxAnchor?.y ?? 0,
                min: -20,
                max: 20,
                step: 0.01,
            },
            monitorBoxAnchorZ: {
                value: monitor?.boxAnchor?.z ?? 0,
                min: -20,
                max: 20,
                step: 0.01,
            },
            monitorApproachYawOffset: {
                value:
                    monitor?.approachYawOffset ?? MONITOR_APPROACH_YAW_OFFSET,
                min: -Math.PI,
                max: Math.PI,
                step: 0.01,
            },
        }),
        { collapsed: true }
    ) as [
        MonitorControls,
        (value: Partial<MonitorControls>) => void,
        <T extends keyof MonitorControls>(path: T) => MonitorControls[T],
    ];
    ({
        monitorRotationY,
        monitorX,
        monitorY,
        monitorZ,
        monitorBoxSizeX,
        monitorBoxSizeY,
        monitorBoxSizeZ,
        monitorBoxAnchorX,
        monitorBoxAnchorY,
        monitorBoxAnchorZ,
        monitorApproachYawOffset,
    } = monitorControls);
    setControlsRef.current = setMonitorControls;
    monitorInteractiveSize = [
        monitorBoxSizeX,
        monitorBoxSizeY,
        monitorBoxSizeZ,
    ];
    monitorInteractiveCenter = [
        monitorBoxAnchorX,
        monitorBoxAnchorY,
        monitorBoxAnchorZ,
    ];
    // #endif

    // #if !DEBUG
    monitorRotationY = monitor?.rotation?.y;
    monitorX = monitor?.position?.x;
    monitorY = monitor?.position?.y;
    monitorZ = monitor?.position?.z;
    monitorBoxSizeX = monitor?.boxSize?.x ?? 5;
    monitorBoxSizeY = monitor?.boxSize?.y ?? 2;
    monitorBoxSizeZ = monitor?.boxSize?.z ?? 3;
    monitorBoxAnchorX = monitor?.boxAnchor?.x ?? 0;
    monitorBoxAnchorY = monitor?.boxAnchor?.y ?? 0;
    monitorBoxAnchorZ = monitor?.boxAnchor?.z ?? 0;
    monitorApproachYawOffset =
        monitor?.approachYawOffset ?? MONITOR_APPROACH_YAW_OFFSET;
    monitorInteractiveSize = [
        monitorBoxSizeX,
        monitorBoxSizeY,
        monitorBoxSizeZ,
    ];
    monitorInteractiveCenter = [
        monitorBoxAnchorX,
        monitorBoxAnchorY,
        monitorBoxAnchorZ,
    ];
    // #endif

    // #if DEBUG
    const handleBoundsResolved = useCallback((bounds: InteractiveBounds) => {
        const setControls = setControlsRef.current;

        if (!shouldSeedBoxControlsRef.current || !setControls) {
            return;
        }

        setControls({
            monitorBoxSizeX: bounds.size[0],
            monitorBoxSizeY: bounds.size[1],
            monitorBoxSizeZ: bounds.size[2],
            monitorBoxAnchorX: bounds.center[0],
            monitorBoxAnchorY: bounds.center[1],
            monitorBoxAnchorZ: bounds.center[2],
        });

        shouldSeedBoxControlsRef.current = false;
    }, []);
    // #endif

    const computeCameraTarget = useCallback(
        ({
            group,
            worldQuaternion,
        }: {
            group: Group;
            worldQuaternion: Quaternion;
        }) => {
            forwardWorld
                .copy(forwardBase)
                .applyQuaternion(worldQuaternion)
                .normalize();
            upWorld.copy(upBase).applyQuaternion(worldQuaternion).normalize();
            // The monitor interaction anchor is biased to the left of the
            // visible screen center, so we apply a configurable yaw offset
            // to keep the terminal transition visually centered on display.
            adjustedForward
                .copy(forwardWorld)
                .applyAxisAngle(upWorld, monitorApproachYawOffset)
                .normalize();

            // Use the interactive box anchor as the focal point so we move
            // into the monitor screen instead of the model pivot.
            screenCenterWorld.set(
                monitorBoxAnchorX,
                monitorBoxAnchorY,
                monitorBoxAnchorZ
            );
            group.localToWorld(screenCenterWorld);

            // Reuse vectors to avoid allocation spikes when entering the terminal.
            cameraPosition
                .copy(screenCenterWorld)
                .addScaledVector(adjustedForward, MONITOR_CAMERA_DISTANCE)
                .addScaledVector(upWorld, MONITOR_CAMERA_HEIGHT);

            lookAtPosition
                .copy(screenCenterWorld)
                .addScaledVector(upWorld, MONITOR_LOOK_AT_HEIGHT);

            return {
                position: [
                    cameraPosition.x,
                    cameraPosition.y,
                    cameraPosition.z,
                ],
                lookAt: [lookAtPosition.x, lookAtPosition.y, lookAtPosition.z],
            } satisfies CameraTarget;
        },
        [
            forwardBase,
            forwardWorld,
            upWorld,
            adjustedForward,
            screenCenterWorld,
            cameraPosition,
            lookAtPosition,
            monitorBoxAnchorX,
            monitorBoxAnchorY,
            monitorBoxAnchorZ,
            monitorApproachYawOffset,
            upBase,
        ]
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
        <group
            position={[monitorX, monitorY, monitorZ]}
            rotation={[0, monitorRotationY, 0]}
        >
            <primitive
                object={monitorModel.scene}
                position={[0, 0, 0]}
                rotation={[0, 0, 0]}
            />
            <InteractiveBox
                message={MONITOR_MESSAGE}
                proximityPosition={proximityPosition}
                onEnter={handleEnter}
                computeCameraTarget={computeCameraTarget}
                // #if DEBUG
                onResolvedBounds={handleBoundsResolved}
                // #endif
                size={monitorInteractiveSize}
                center={monitorInteractiveCenter}
            />
        </group>
    );
});
Monitor.displayName = "Monitor";

useGLTF.preload("/models/monitor.glb");

export default Monitor;
