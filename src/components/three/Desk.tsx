import { memo, useCallback, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { Group, Quaternion, Vector3 } from "three";
import { useScene } from "@/lib/contexts/SceneContext";
import { useMovement } from "@/lib/stores/useMovement";
import { useExperience } from "@/lib/stores/useExperience";
import type { CameraTarget } from "@/lib/stores/useExperience";
import InteractiveBox from "@/components/three/InteractiveBox";
import Monitor from "@/components/three/Monitor";

type DeskControls = {
    deskX: number;
    deskY: number;
    deskZ: number;
    deskScale: number;
};

const MONITOR_MESSAGE = "Press ENTER to use the computer.";

const Desk = memo(() => {
    const { desk } = useScene();
    const characterPosition = useMovement(state => state.position);
    const enterTerminal = useExperience(state => state.enterTerminal);
    const deskModel = useGLTF("/models/l_shaped_desk.glb");
    const monitorRef = useRef<Group>(null);

    const forwardBase = useMemo(() => new Vector3(0, 0, -1), []);
    const upBase = useMemo(() => new Vector3(0, 1, 0), []);
    const sharedPosition = useMemo(() => new Vector3(), []);
    const sharedQuaternion = useMemo(() => new Quaternion(), []);

    let deskX, deskY, deskZ, deskScale;

    // #if DEBUG
    ({ deskX, deskY, deskZ, deskScale } = useControls(
        "Desk",
        {
            deskX: {
                value: desk?.position?.x ?? 0,
                min: -20,
                max: 10,
                step: 0.01,
            },
            deskY: {
                value: desk?.position?.y ?? 0,
                min: -10,
                max: 10,
                step: 0.01,
            },
            deskZ: {
                value: desk?.position?.z ?? 0,
                min: -20,
                max: 10,
                step: 0.01,
            },
            deskScale: {
                value: desk?.scale ?? 0,
                min: 0.1,
                max: 10,
                step: 0.01,
            },
        },
        { collapsed: true }
    ) as DeskControls);
    // #endif

    // #if !DEBUG
    deskX = desk?.position?.x;
    deskY = desk?.position?.y;
    deskZ = desk?.position?.z;
    deskScale = desk?.scale;
    // #endif

    // L-shaped desk positioned snug in northwest corner
    const cornerX = deskX ?? desk?.position?.x; // Very close to west wall
    const cornerZ = deskZ ?? desk?.position?.z; // Very close to north wall
    const deskHeight = desk?.height;

    // Memoize Vector3 creation to prevent recreation on every render
    const proximityPosition = useMemo(
        () =>
            new Vector3(
                characterPosition.x,
                characterPosition.y,
                characterPosition.z
            ),
        [characterPosition.x, characterPosition.y, characterPosition.z]
    );

    const computeCameraTarget = useCallback(
        ({ group, worldPosition, worldQuaternion }: {
            group: Group;
            worldPosition: Vector3;
            worldQuaternion: Quaternion;
        }) => {
            const targetGroup = monitorRef.current ?? group;

            if (monitorRef.current) {
                targetGroup.getWorldPosition(sharedPosition);
                targetGroup.getWorldQuaternion(sharedQuaternion);
            } else {
                sharedPosition.copy(worldPosition);
                sharedQuaternion.copy(worldQuaternion);
            }

            const forward = forwardBase
                .clone()
                .applyQuaternion(sharedQuaternion)
                .normalize();
            const up = upBase.clone().applyQuaternion(sharedQuaternion).normalize();

            const cameraPosition = sharedPosition
                .clone()
                .add(forward.clone().multiplyScalar(3.25))
                .add(up.clone().multiplyScalar(1.4));

            const lookAtPosition = sharedPosition
                .clone()
                .add(up.clone().multiplyScalar(0.9));

            return {
                position: [
                    cameraPosition.x,
                    cameraPosition.y,
                    cameraPosition.z,
                ],
                lookAt: [
                    lookAtPosition.x,
                    lookAtPosition.y,
                    lookAtPosition.z,
                ],
            } satisfies CameraTarget;
        },
        [forwardBase, upBase, sharedPosition, sharedQuaternion]
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
            position={[deskX, deskY, deskZ]}
            scale={[deskScale, deskScale, deskScale]}
            proximityPosition={proximityPosition}
            onEnter={handleEnter}
            computeCameraTarget={computeCameraTarget}
        >
            {/* Desk model */}
            <primitive object={deskModel.scene} />

            {/* Monitor model */}
            <Monitor ref={monitorRef} />

            {/* Invisible collision boxes */}
            <group>
                {/* Collision for horizontal desk section */}
                <mesh
                    position={[cornerX + 2.5, deskHeight / 2, cornerZ + 1]}
                    visible={false}
                >
                    <boxGeometry args={[5.2, deskHeight * 2, 2.2]} />
                </mesh>

                {/* Collision for vertical desk section */}
                <mesh
                    position={[cornerX + 1, deskHeight / 2, cornerZ + 3.5]}
                    visible={false}
                >
                    <boxGeometry args={[2.2, deskHeight * 2, 3.2]} />
                </mesh>
            </group>
        </InteractiveBox>
    );
});
Desk.displayName = "Desk";

useGLTF.preload("/models/l_shaped_desk.glb");

export default Desk;
