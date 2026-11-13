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
import { useMessage } from "@/lib/contexts/MessageContext";
import { INTRO_MESSAGE } from "@/lib/constants/sceneMessages";
import { PHYSICS_TIMESTEP, PLAYER_GROUPS } from "@/lib/constants/physics";
import { getFacingRotation, toCameraRelative } from "@/utils/movement";

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
const SHOULDER_Y = 1.1;
const HIP_Y = -0.3;
const ARM_LENGTH = 1.2;
const LEG_LENGTH = 1;
// The collision capsule is as wide as the torso. Swinging arms can brush
// walls, but a capsule wide enough for them would hold the avatar too far
// from whatever it walks up to.
const MODEL_TORSO_HALF_WIDTH = 0.5;
// Gap the character controller keeps between the capsule and obstacles
const CONTROLLER_OFFSET = 0.01;
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
    } = useScene();
    const { message, clearMessage } = useMessage();
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
        roughness: number;

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
    // #endif

    // Scale the avatar to the configured height and lift it so its feet rest
    // on the floor. The movement store's y is the reference height used by the
    // camera, so it isn't used to place the body.
    const characterScale = height / MODEL_HEIGHT;
    const bodyY = -MODEL_FEET_Y * characterScale;
    const capsuleRadius = MODEL_TORSO_HALF_WIDTH * characterScale;
    // Half the length of the capsule's straight section, between its caps
    const capsuleHalfHeight = height / 2 - capsuleRadius;

    // Current rotation target
    const targetRotation = useRef(0);
    const currentRotation = useRef(0);
    const hasClearedIntro = useRef(false);
    // Written by the physics step, read by the render loop's animation
    const isMovingRef = useRef(false);
    const desiredMovement = useMemo(() => ({ x: 0, y: 0, z: 0 }), []);
    const nextTranslation = useMemo(() => ({ x: 0, y: 0, z: 0 }), []);

    const bodyRef = useRef<THREE.Group>(null);
    const leftArmRef = useRef<THREE.Group>(null);
    const rightArmRef = useRef<THREE.Group>(null);
    const leftLegRef = useRef<THREE.Group>(null);
    const rightLegRef = useRef<THREE.Group>(null);
    const stridePhase = useRef(0);
    // 0 when standing still, 1 at full stride, eased between the two
    const walkBlend = useRef(0);

    const blobShadowUniforms = useMemo(
        () => ({ uOpacity: { value: BLOB_SHADOW_OPACITY } }),
        []
    );

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
    // breathing loop when standing still
    const animateBody = (isMoving: boolean, elapsed: number, delta: number) => {
        walkBlend.current = THREE.MathUtils.damp(
            walkBlend.current,
            isMoving ? 1 : 0,
            WALK_BLEND_RATE,
            delta
        );
        if (isMoving) {
            stridePhase.current += STRIDE_FREQUENCY * delta;
        }

        const blend = walkBlend.current;
        const swing = Math.sin(stridePhase.current) * MAX_LIMB_SWING * blend;
        const stepHeight = Math.abs(Math.sin(stridePhase.current));
        const bob = stepHeight * BOB_HEIGHT;
        // Compress as a foot lands, stretch at the top of the step
        const stepStretch = (stepHeight * 2 - 1) * stepSquash;
        const breathStretch =
            Math.sin(elapsed * BREATH_FREQUENCY) * BREATH_SQUASH;
        const stretch = stepStretch * blend + breathStretch * (1 - blend);

        if (leftArmRef.current) leftArmRef.current.rotation.x = swing;
        if (rightArmRef.current) rightArmRef.current.rotation.x = -swing;
        if (leftLegRef.current) leftLegRef.current.rotation.x = -swing;
        if (rightLegRef.current) rightLegRef.current.rotation.x = swing;
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

        if (isMoving) {
            if (!hasClearedIntro.current && message === INTRO_MESSAGE) {
                clearMessage();
                hasClearedIntro.current = true;
            }

            const rotationDiff =
                targetRotation.current - currentRotation.current;

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
        }

        animateBody(isMoving, state.clock.elapsedTime, delta);
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

                <group ref={bodyRef}>
                    <BodyPart
                        size={[0.8, 0.8, 0.8]}
                        position={[0, 2, 0]}
                        color={skinColor}
                        roughness={roughness}
                    />

                    {FACE_FEATURES.map(
                        ({ position: featurePosition, size }) => (
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

                    <BodyPart
                        size={[1, 1.5, 0.5]}
                        position={[0, 0.5, 0]}
                        color={shirtColor}
                        roughness={roughness}
                    />

                    <group ref={leftArmRef} position={[-0.8, SHOULDER_Y, 0]}>
                        <BodyPart
                            size={[0.3, ARM_LENGTH, 0.3]}
                            position={[0, -ARM_LENGTH / 2, 0]}
                            color={skinColor}
                            roughness={roughness}
                        />
                    </group>
                    <group ref={rightArmRef} position={[0.8, SHOULDER_Y, 0]}>
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
        </RigidBody>
    );
});
Character.displayName = "Character";

export default Character;
