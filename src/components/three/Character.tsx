import { memo, useRef, useEffect, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, useKeyboardControls } from "@react-three/drei";
import {
    CapsuleCollider,
    RigidBody,
    useBeforePhysicsStep,
    useRapier,
    type RapierCollider,
    type RapierContext,
    type RapierRigidBody,
} from "@react-three/rapier";
import * as THREE from "three";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useMovement } from "@/lib/stores/useMovement";
import { useScene } from "@/lib/contexts/SceneContext";
import { useExperience } from "@/lib/stores/useExperience";
import { useMusic } from "@/lib/stores/useMusic";
import { useReach } from "@/lib/stores/useReach";
import { useAudio } from "@/lib/stores/useAudio";
import { PHYSICS_TIMESTEP, PLAYER_GROUPS } from "@/lib/constants/physics";
import { getFacingRotation, toCameraRelative } from "@/utils/movement";
import { useCameraSeeThrough } from "@/hooks/use-camera-see-through";
import { createFootstepBuffer } from "@/utils/footstep";

enum Controls {
    forward = "forward",
    backward = "backward",
    leftward = "leftward",
    rightward = "rightward",
}

type CharacterController = ReturnType<
    RapierContext["world"]["createCharacterController"]
>;

// The avatar's box geometry spans from the bottom of the legs (y = -1.3) to
// the top of the head (y = 2.4) in local units.
const MODEL_FEET_Y = -1.3;
const MODEL_HEIGHT = 3.7;
// Limbs hang from these joints so they swing from the shoulder and hip
const SHOULDER_X = 0.8;
const SHOULDER_Y = 1.1;
const HIP_Y = -0.3;
// The head tips from the base of its box when nodding
const NECK_Y = 1.6;
const ARM_LENGTH = 1.2;
const LEG_LENGTH = 1;
// The collision capsule is as wide as the torso. Swinging arms can brush
// walls, but a capsule wide enough for them would hold the avatar too far
// from whatever it walks up to.
const MODEL_TORSO_HALF_WIDTH = 0.5;
// Gap the character controller keeps between the capsule and obstacles
const CONTROLLER_OFFSET = 0.01;
// Out past the swinging arms, in model units: the character fades out of a
// camera shot whose line of sight passes this close to its center
const SEE_THROUGH_REACH = 1.2;
// Slight bevel so edges catch highlights like the room's models do
const EDGE_RADIUS = 0.06;

// Walk cycle, in radians per second and local model units
const STRIDE_FREQUENCY = 10;
const MAX_LIMB_SWING = 0.6;
const BOB_HEIGHT = 0.1;
const WALK_BLEND_RATE = 10;
const TURN_RATE = 6;
const BREATH_FREQUENCY = 2;
// Idle swell, as a fraction of body height. The walking squash and stretch
// amount comes from SceneContext.
const BREATH_SQUASH = 0.025;

// The arms hang straight down from the shoulder at rest
const ARM_REST_DIRECTION = new THREE.Vector3(0, -1, 0);

const BLOB_SHADOW_RADIUS = 1;
const BLOB_SHADOW_OPACITY = 0.35;
const BLOB_SHADOW_VERTEX = /* glsl */ `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;
const BLOB_SHADOW_FRAGMENT = /* glsl */ `
    uniform float uOpacity;
    varying vec2 vUv;
    void main() {
        float falloff = 1.0 - smoothstep(0.0, 1.0, length(vUv - 0.5) * 2.0);
        gl_FragColor = vec4(0.0, 0.0, 0.0, falloff * uOpacity);
    }
`;

type Vec3 = [number, number, number];

// Eyes and mouth, set just proud of the head's front face
const FACE_FEATURES: { position: Vec3; size: Vec3 }[] = [
    { position: [-0.15, 2.1, -0.41], size: [0.1, 0.1, 0.02] },
    { position: [0.15, 2.1, -0.41], size: [0.1, 0.1, 0.02] },
    { position: [0, 1.9, -0.41], size: [0.2, 0.05, 0.02] },
];

type CharacterControls = {
    characterHeight: number;
    characterSpeed: number;
    stepSquash: number;
    skinColor: string;
    shirtColor: string;
    pantsColor: string;
    featureColor: string;
    roughness: number;
    footstepVolume: number;
    footstepRefDistance: number;
    footstepPitchVariation: number;
    footstepRugVolume: number;
    danceBlendRate: number;
    danceNodAngle: number;
    danceArmsUpAngle: number;
    danceArmWaveAngle: number;
    danceSwayAngle: number;
    danceHeadCounterTilt: number;
    danceBeatBounce: number;
    reachTime: number;
    reachHoldTime: number;
    reachReturnTime: number;
};

type BodyPartProps = {
    size: Vec3;
    position: Vec3;
    color: string;
    roughness: number;
};

const BodyPart = ({ size, position, color, roughness }: BodyPartProps) => (
    <RoundedBox
        args={size}
        radius={EDGE_RADIUS}
        smoothness={3}
        position={position}
        castShadow
        receiveShadow
    >
        <meshStandardMaterial color={color} roughness={roughness} />
    </RoundedBox>
);

interface CharacterProps {
    // False while the loading screen still covers the room
    inputEnabled?: boolean;
}

const Character = memo(({ inputEnabled = true }: CharacterProps) => {
    const characterRef = useRef<THREE.Group>(null);
    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const colliderRef = useRef<RapierCollider>(null);
    const controllerRef = useRef<CharacterController | null>(null);
    const { world, rapier } = useRapier();
    const [subscribe, getKeys] = useKeyboardControls<Controls>();
    // Read once: after mount the rigid body owns the position, and the store
    // only mirrors it for the camera
    const [spawnPosition] = useState<Coordinate>(() => {
        const { x, z } = useMovement.getState().position;
        return [x, 0, z];
    });
    const setPosition = useMovement(state => state.setPosition);
    const setHeading = useMovement(state => state.setHeading);
    const {
        characterSpeed,
        characterStepSquash,
        characterHeight,
        characterAppearance,
        footsteps,
        characterDance,
        characterReach,
        rug,
    } = useScene();
    // Use individual selectors to prevent unnecessary rerenders
    const mode = useExperience(state => state.mode);
    const isTransitioning = useExperience(state => state.isTransitioning);

    const allowMovement = inputEnabled && mode === "scene" && !isTransitioning;

    let height: number,
        speed: number,
        stepSquash: number,
        skinColor: string,
        shirtColor: string,
        pantsColor: string,
        featureColor: string,
        roughness: number,
        footstepVolume: number,
        footstepRefDistance: number,
        footstepPitchVariation: number,
        footstepRugVolume: number,
        danceBlendRate: number,
        danceNodAngle: number,
        danceArmsUpAngle: number,
        danceArmWaveAngle: number,
        danceSwayAngle: number,
        danceHeadCounterTilt: number,
        danceBeatBounce: number,
        reachTime: number,
        reachHoldTime: number,
        reachReturnTime: number;

    // #if DEBUG
    ({
        characterHeight: height,
        characterSpeed: speed,
        stepSquash,
        skinColor,
        shirtColor,
        pantsColor,
        featureColor,
        roughness,
        footstepVolume,
        footstepRefDistance,
        footstepPitchVariation,
        footstepRugVolume,
        danceBlendRate,
        danceNodAngle,
        danceArmsUpAngle,
        danceArmWaveAngle,
        danceSwayAngle,
        danceHeadCounterTilt,
        danceBeatBounce,
        reachTime,
        reachHoldTime,
        reachReturnTime,
    } = useControls(
        "Character",
        {
            characterHeight: {
                value: characterHeight,
                min: 1,
                max: 12,
                step: 0.01,
            },
            characterSpeed: {
                value: characterSpeed,
                min: 1,
                max: 30,
                step: 0.5,
            },
            stepSquash: {
                value: characterStepSquash,
                min: 0,
                max: 0.2,
                step: 0.005,
            },
            skinColor: characterAppearance.skinColor,
            shirtColor: characterAppearance.shirtColor,
            pantsColor: characterAppearance.pantsColor,
            featureColor: characterAppearance.featureColor,
            roughness: {
                value: characterAppearance.roughness,
                min: 0,
                max: 1,
                step: 0.05,
            },
            footstepVolume: {
                value: footsteps.volume,
                min: 0,
                max: 2,
                step: 0.01,
            },
            footstepRefDistance: {
                value: footsteps.refDistance,
                min: 0.5,
                max: 30,
                step: 0.1,
            },
            footstepPitchVariation: {
                value: footsteps.pitchVariation,
                min: 0,
                max: 1200,
                step: 10,
                label: "footstepPitch ± (cents)",
            },
            footstepRugVolume: {
                value: footsteps.rugVolume,
                min: 0,
                max: 1,
                step: 0.01,
            },
            danceBlendRate: {
                value: characterDance.blendRate,
                min: 0.5,
                max: 20,
                step: 0.5,
            },
            danceNodAngle: {
                value: characterDance.nodAngle,
                min: 0,
                max: 1,
                step: 0.01,
            },
            danceArmsUpAngle: {
                value: characterDance.armsUpAngle,
                min: 0,
                max: Math.PI,
                step: 0.05,
            },
            danceArmWaveAngle: {
                value: characterDance.armWaveAngle,
                min: 0,
                max: 1,
                step: 0.01,
            },
            danceSwayAngle: {
                value: characterDance.swayAngle,
                min: 0,
                max: 0.5,
                step: 0.005,
            },
            danceHeadCounterTilt: {
                value: characterDance.headCounterTilt,
                min: 0,
                max: 2,
                step: 0.05,
            },
            danceBeatBounce: {
                value: characterDance.beatBounce,
                min: 0,
                max: 0.2,
                step: 0.005,
            },
            reachTime: {
                value: characterReach.reachTime,
                min: 0.05,
                max: 2,
                step: 0.05,
            },
            reachHoldTime: {
                value: characterReach.holdTime,
                min: 0,
                max: 2,
                step: 0.05,
            },
            reachReturnTime: {
                value: characterReach.returnTime,
                min: 0.05,
                max: 2,
                step: 0.05,
            },
        },
        { collapsed: true }
    ) as CharacterControls);
    // #endif

    // #if !DEBUG
    height = characterHeight;
    speed = characterSpeed;
    stepSquash = characterStepSquash;
    ({ skinColor, shirtColor, pantsColor, featureColor, roughness } =
        characterAppearance);
    footstepVolume = footsteps.volume;
    footstepRefDistance = footsteps.refDistance;
    footstepPitchVariation = footsteps.pitchVariation;
    footstepRugVolume = footsteps.rugVolume;
    danceBlendRate = characterDance.blendRate;
    danceNodAngle = characterDance.nodAngle;
    danceArmsUpAngle = characterDance.armsUpAngle;
    danceArmWaveAngle = characterDance.armWaveAngle;
    danceSwayAngle = characterDance.swayAngle;
    danceHeadCounterTilt = characterDance.headCounterTilt;
    danceBeatBounce = characterDance.beatBounce;
    reachTime = characterReach.reachTime;
    reachHoldTime = characterReach.holdTime;
    reachReturnTime = characterReach.returnTime;
    // #endif

    // Scale the avatar to the configured height and lift it so its feet rest
    // on the floor. The movement store's y is the reference height used by the
    // camera, so it isn't used to place the body.
    const characterScale = height / MODEL_HEIGHT;
    const bodyY = -MODEL_FEET_Y * characterScale;
    const capsuleRadius = MODEL_TORSO_HALF_WIDTH * characterScale;
    // Half the length of the capsule's straight section, between its caps
    const capsuleHalfHeight = height / 2 - capsuleRadius;

    useCameraSeeThrough(characterRef, SEE_THROUGH_REACH * characterScale);

    // Current rotation target
    const targetRotation = useRef(0);
    const currentRotation = useRef(0);
    // Written by the physics step, read by the render loop's animation
    const isMovingRef = useRef(false);
    const desiredMovement = useMemo(() => ({ x: 0, y: 0, z: 0 }), []);
    const nextTranslation = useMemo(() => ({ x: 0, y: 0, z: 0 }), []);

    const swayRef = useRef<THREE.Group>(null);
    const bodyRef = useRef<THREE.Group>(null);
    const leftArmRef = useRef<THREE.Group>(null);
    const rightArmRef = useRef<THREE.Group>(null);
    const leftLegRef = useRef<THREE.Group>(null);
    const rightLegRef = useRef<THREE.Group>(null);
    const headRef = useRef<THREE.Group>(null);
    const stridePhase = useRef(0);
    // 0 when standing still, 1 at full stride, eased between the two
    const walkBlend = useRef(0);
    // 0 when not dancing, 1 at full groove, eased between the two
    const danceBlend = useRef(0);
    // Keeps the beat while the dance fades out after the music stops
    const lastTempo = useRef(0);
    const footstepRef = useRef<THREE.PositionalAudio>(null);
    // Counts foot plants, so each new one plays a step
    const lastStep = useRef(0);
    // Seconds into the current reach; Infinity when not reaching
    const reachClock = useRef(Infinity);
    // Starts at the current request, so remounting doesn't replay an old one
    const lastReachId = useRef(useReach.getState().requestId);
    // +1 reaches with the arm on the model's +X side, -1 with the other
    const reachSide = useRef(1);
    const reachDirection = useMemo(() => new THREE.Vector3(), []);
    const poseQuaternion = useMemo(() => new THREE.Quaternion(), []);
    const reachQuaternion = useMemo(() => new THREE.Quaternion(), []);
    const listener = useAudio(state => state.listener);
    // Synthesized once the visitor's first input unlocks audio
    const footstepBuffer = useMemo(
        () => (listener ? createFootstepBuffer(listener.context) : null),
        [listener]
    );

    const blobShadowUniforms = useMemo(
        () => ({ uOpacity: { value: BLOB_SHADOW_OPACITY } }),
        []
    );

    useEffect(() => {
        footstepRef.current?.setRefDistance(footstepRefDistance);
    }, [footstepBuffer, footstepRefDistance]);

    // A foot plants each time the stride passes a half cycle, as the bob
    // bottoms out. The rug muffles the steps, and a random detune keeps them
    // from sounding mechanical.
    const playFootstep = () => {
        const sound = footstepRef.current;
        if (!sound?.buffer) return;

        const { x, z } = useMovement.getState().position;
        const isOnRug =
            Math.abs(x - rug.position.x) < rug.width / 2 &&
            Math.abs(z - rug.position.z) < rug.depth / 2;

        if (sound.isPlaying) sound.stop();
        sound.setVolume(footstepVolume * (isOnRug ? footstepRugVolume : 1));
        sound.setDetune((Math.random() * 2 - 1) * footstepPitchVariation);
        sound.play();
    };

    useEffect(() => {
        const controller = world.createCharacterController(CONTROLLER_OFFSET);
        controllerRef.current = controller;

        return () => {
            world.removeCharacterController(controller);
            controllerRef.current = null;
        };
    }, [world]);

    useEffect(() => {
        const initialRotation = Math.PI;
        currentRotation.current = initialRotation;
        targetRotation.current = initialRotation;

        if (characterRef.current) {
            characterRef.current.rotation.y = initialRotation;
        }
    }, []);

    // #if DEBUG
    // Subscribe to keyboard events for movement logging in debug mode only.
    useEffect(() => {
        const unsubscribe = subscribe(
            state => [
                state.forward,
                state.backward,
                state.leftward,
                state.rightward,
            ],
            keys => {
                const [forward, backward, leftward, rightward] = keys;
                if (forward || backward || leftward || rightward) {
                    console.log("Movement keys:", {
                        forward,
                        backward,
                        leftward,
                        rightward,
                    });
                }
            }
        );

        return unsubscribe;
    }, [subscribe]);
    // #endif

    // Animates the limbs: a walk cycle while moving that eases into an idle
    // breathing loop when standing still, plus a dance in time with the
    // music while it stands still
    const animateBody = (isMoving: boolean, elapsed: number, delta: number) => {
        walkBlend.current = THREE.MathUtils.damp(
            walkBlend.current,
            isMoving ? 1 : 0,
            WALK_BLEND_RATE,
            delta
        );
        if (isMoving) {
            stridePhase.current += STRIDE_FREQUENCY * delta;
            const step = Math.floor(stridePhase.current / Math.PI);
            if (step !== lastStep.current) {
                lastStep.current = step;
                playFootstep();
            }
        }

        // Read via getState so the music doesn't rerender the avatar
        const { tempo, trackTime } = useMusic.getState();
        if (tempo !== null) {
            lastTempo.current = tempo;
        }
        danceBlend.current = THREE.MathUtils.damp(
            danceBlend.current,
            tempo !== null && !isMoving ? 1 : 0,
            danceBlendRate,
            delta
        );
        const dance = danceBlend.current;
        // Eases the arms out of their start too, so they float up instead
        // of jumping
        const armsUp = THREE.MathUtils.smootherstep(dance, 0, 1);
        const beat = (trackTime * lastTempo.current) / 60;
        // Snaps down on each beat and floats back up between them
        const onBeat = 1 - Math.abs(Math.sin(Math.PI * beat));
        // A full left-right sway every two beats, at each side on the beat
        const sway = Math.sin(Math.PI * (beat - 0.5)) * dance;

        const blend = walkBlend.current;
        const swing = Math.sin(stridePhase.current) * MAX_LIMB_SWING * blend;
        const stepHeight = Math.abs(Math.sin(stridePhase.current));
        const bob = stepHeight * BOB_HEIGHT;
        // Compress as a foot lands, stretch at the top of the step
        const stepStretch = (stepHeight * 2 - 1) * stepSquash;
        const breathStretch =
            Math.sin(elapsed * BREATH_FREQUENCY) * BREATH_SQUASH;
        const stretch =
            stepStretch * blend +
            breathStretch * (1 - blend) * (1 - dance) -
            onBeat * danceBeatBounce * dance;
        const armRaise = danceArmsUpAngle * armsUp;
        const armWave = danceArmWaveAngle * sway;

        // Y is zeroed too, since a reach can leave the arm twisted
        leftArmRef.current?.rotation.set(swing, 0, -armRaise + armWave);
        rightArmRef.current?.rotation.set(-swing, 0, armRaise + armWave);
        if (leftLegRef.current) leftLegRef.current.rotation.x = -swing;
        if (rightLegRef.current) rightLegRef.current.rotation.x = swing;
        if (swayRef.current) swayRef.current.rotation.z = danceSwayAngle * sway;
        if (bodyRef.current) {
            // Thin out as it stretches so the volume reads as constant
            bodyRef.current.scale.set(
                1 - stretch / 2,
                1 + stretch,
                1 - stretch / 2
            );
            // Scaling pivots on the body's origin, so shift it to keep the
            // feet planted
            bodyRef.current.position.y = bob * blend - MODEL_FEET_Y * stretch;
        }
        if (headRef.current) {
            headRef.current.rotation.x = -danceNodAngle * onBeat * dance;
            headRef.current.rotation.z =
                -danceSwayAngle * danceHeadCounterTilt * sway;
        }
    };

    // Reaches one arm out to a point another object asked for, like the
    // tonearm when the needle drops: turn to face it, swing the nearer arm
    // out, hold, then ease back into whatever pose the body is in. Blending
    // toward the reach from the current pose lets it layer over walking or
    // dancing without fighting them.
    const animateReach = (delta: number) => {
        const { target, requestId } = useReach.getState();
        if (!target) return;
        const { x, z } = useMovement.getState().position;
        // Relative to the character's feet, in model units
        const dx = (target.x - x) / characterScale;
        const dy = target.y / characterScale + MODEL_FEET_Y;
        const dz = (target.z - z) / characterScale;

        if (requestId !== lastReachId.current) {
            lastReachId.current = requestId;
            reachClock.current = 0;
            targetRotation.current = getFacingRotation({ x: dx, z: dz });
            // Whichever arm is already on the target's side
            const yaw = currentRotation.current;
            reachSide.current =
                dx * Math.cos(yaw) - dz * Math.sin(yaw) >= 0 ? 1 : -1;
        }

        const t = reachClock.current;
        if (t >= reachTime + reachHoldTime + reachReturnTime) return;
        reachClock.current += delta;

        const envelope =
            t < reachTime
                ? THREE.MathUtils.smootherstep(t, 0, reachTime)
                : t < reachTime + reachHoldTime
                  ? 1
                  : 1 -
                    THREE.MathUtils.smootherstep(
                        t - reachTime - reachHoldTime,
                        0,
                        reachReturnTime
                    );
        // Walking off drops the reach
        const blend = envelope * (1 - walkBlend.current);
        const arm =
            reachSide.current > 0 ? rightArmRef.current : leftArmRef.current;
        if (blend <= 0 || !arm) return;

        // Undo the character's turn to get the target in model space, then
        // aim from the shoulder. Recomputed each frame since the character
        // is still turning to face it.
        const yaw = currentRotation.current;
        reachDirection
            .set(
                dx * Math.cos(yaw) -
                    dz * Math.sin(yaw) -
                    reachSide.current * SHOULDER_X,
                dy - SHOULDER_Y,
                dx * Math.sin(yaw) + dz * Math.cos(yaw)
            )
            .normalize();
        reachQuaternion.setFromUnitVectors(ARM_REST_DIRECTION, reachDirection);
        poseQuaternion.setFromEuler(arm.rotation).slerp(reachQuaternion, blend);
        arm.rotation.setFromQuaternion(poseQuaternion);
    };

    // Movement runs before each physics step rather than each rendered
    // frame, so it advances at the same fixed rate on any display
    useBeforePhysicsStep(() => {
        const rigidBody = rigidBodyRef.current;
        const collider = colliderRef.current;
        const controller = controllerRef.current;
        isMovingRef.current = false;

        if (!allowMovement || !rigidBody || !collider || !controller) {
            setHeading(null);
            return;
        }

        const keys = getKeys();
        // Input in camera space: -z is "into the screen", +x is screen right
        const inputX = Number(keys.rightward) - Number(keys.leftward);
        const inputZ = Number(keys.backward) - Number(keys.forward);

        if (inputX === 0 && inputZ === 0) {
            setHeading(null);
            return;
        }

        // Rotate input by the camera's orbit so controls follow the view.
        // Read via getState to avoid rerendering on every camera turn.
        const move = toCameraRelative(
            inputX,
            inputZ,
            useMovement.getState().cameraYaw
        );
        // Normalized so diagonals aren't faster than straight lines
        const step = (speed * PHYSICS_TIMESTEP) / Math.hypot(move.x, move.z);
        desiredMovement.x = move.x * step;
        desiredMovement.z = move.z * step;

        // Sweeps the capsule along the desired path and returns how far it
        // can go, sliding along anything it hits instead of stopping dead
        controller.computeColliderMovement(
            collider,
            desiredMovement,
            rapier.QueryFilterFlags.EXCLUDE_SENSORS,
            PLAYER_GROUPS
        );
        const movement = controller.computedMovement();
        const current = rigidBody.translation();
        nextTranslation.x = current.x + movement.x;
        nextTranslation.y = current.y;
        nextTranslation.z = current.z + movement.z;
        rigidBody.setNextKinematicTranslation(nextTranslation);

        isMovingRef.current = true;
        targetRotation.current = getFacingRotation(move);
        setHeading(targetRotation.current);
        setPosition({
            x: nextTranslation.x,
            y: useMovement.getState().position.y,
            z: nextTranslation.z,
        });
    });

    // Visual-only: turning and the walk cycle run every rendered frame
    useFrame((state, delta) => {
        const character = characterRef.current;
        const isMoving = isMovingRef.current;

        if (!character) return;

        // Runs while standing too, to finish a turn or face a reach target
        const rotationDiff = targetRotation.current - currentRotation.current;

        // Handle rotation wrapping (shortest path)
        let shortestDiff = rotationDiff;
        if (Math.abs(rotationDiff) > Math.PI) {
            shortestDiff =
                rotationDiff > 0
                    ? rotationDiff - 2 * Math.PI
                    : rotationDiff + 2 * Math.PI;
        }

        currentRotation.current += THREE.MathUtils.damp(
            0,
            shortestDiff,
            TURN_RATE,
            delta
        );
        // Keep within [-PI, PI] so the shortest-path check stays valid
        currentRotation.current = Math.atan2(
            Math.sin(currentRotation.current),
            Math.cos(currentRotation.current)
        );
        character.rotation.y = currentRotation.current;

        animateBody(isMoving, state.clock.elapsedTime, delta);
        animateReach(delta);
    });

    return (
        // Kinematic: moved only by code, but other colliders still block it.
        // colliders={false} stops Rapier from generating colliders from the
        // body's meshes, so the capsule below is its only shape.
        <RigidBody
            ref={rigidBodyRef}
            type="kinematicPosition"
            colliders={false}
            position={spawnPosition}
        >
            <CapsuleCollider
                ref={colliderRef}
                args={[capsuleHalfHeight, capsuleRadius]}
                position={[0, height / 2, 0]}
                collisionGroups={PLAYER_GROUPS}
            />
            <group
                ref={characterRef}
                scale={[characterScale, characterScale, characterScale]}
                position={[0, bodyY, 0]}
            >
                {/* Soft contact shadow so the feet read as planted on the floor;
                it sits outside the body group so it doesn't bob */}
                <mesh
                    position={[0, MODEL_FEET_Y + 0.02, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    renderOrder={1}
                >
                    <planeGeometry
                        args={[BLOB_SHADOW_RADIUS * 2, BLOB_SHADOW_RADIUS * 2]}
                    />
                    <shaderMaterial
                        uniforms={blobShadowUniforms}
                        vertexShader={BLOB_SHADOW_VERTEX}
                        fragmentShader={BLOB_SHADOW_FRAGMENT}
                        transparent
                        depthWrite={false}
                    />
                </mesh>

                {listener && footstepBuffer && (
                    <positionalAudio
                        ref={footstepRef}
                        args={[listener]}
                        buffer={footstepBuffer}
                        position={[0, MODEL_FEET_Y, 0]}
                    />
                )}

                {/* Pivots at the feet, so swaying to the music leans the
                whole body without sliding the feet */}
                <group ref={swayRef} position={[0, MODEL_FEET_Y, 0]}>
                    <group position={[0, -MODEL_FEET_Y, 0]}>
                        <group ref={bodyRef}>
                            <group ref={headRef} position={[0, NECK_Y, 0]}>
                                <group position={[0, -NECK_Y, 0]}>
                                    <BodyPart
                                        size={[0.8, 0.8, 0.8]}
                                        position={[0, 2, 0]}
                                        color={skinColor}
                                        roughness={roughness}
                                    />

                                    {FACE_FEATURES.map(
                                        ({
                                            position: featurePosition,
                                            size,
                                        }) => (
                                            <mesh
                                                key={featurePosition.join(",")}
                                                position={featurePosition}
                                                receiveShadow
                                            >
                                                <boxGeometry args={size} />
                                                <meshStandardMaterial
                                                    color={featureColor}
                                                    roughness={roughness}
                                                />
                                            </mesh>
                                        )
                                    )}
                                </group>
                            </group>

                            <BodyPart
                                size={[1, 1.5, 0.5]}
                                position={[0, 0.5, 0]}
                                color={shirtColor}
                                roughness={roughness}
                            />

                            <group
                                ref={leftArmRef}
                                position={[-SHOULDER_X, SHOULDER_Y, 0]}
                            >
                                <BodyPart
                                    size={[0.3, ARM_LENGTH, 0.3]}
                                    position={[0, -ARM_LENGTH / 2, 0]}
                                    color={skinColor}
                                    roughness={roughness}
                                />
                            </group>
                            <group
                                ref={rightArmRef}
                                position={[SHOULDER_X, SHOULDER_Y, 0]}
                            >
                                <BodyPart
                                    size={[0.3, ARM_LENGTH, 0.3]}
                                    position={[0, -ARM_LENGTH / 2, 0]}
                                    color={skinColor}
                                    roughness={roughness}
                                />
                            </group>

                            <group ref={leftLegRef} position={[-0.3, HIP_Y, 0]}>
                                <BodyPart
                                    size={[0.3, LEG_LENGTH, 0.3]}
                                    position={[0, -LEG_LENGTH / 2, 0]}
                                    color={pantsColor}
                                    roughness={roughness}
                                />
                            </group>
                            <group ref={rightLegRef} position={[0.3, HIP_Y, 0]}>
                                <BodyPart
                                    size={[0.3, LEG_LENGTH, 0.3]}
                                    position={[0, -LEG_LENGTH / 2, 0]}
                                    color={pantsColor}
                                    roughness={roughness}
                                />
                            </group>
                        </group>
                    </group>
                </group>
            </group>
        </RigidBody>
    );
});
Character.displayName = "Character";

export default Character;
