import { memo, useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useMovement } from "@/lib/stores/useMovement";
import { useScene } from "@/lib/contexts/SceneContext";
import { useExperience } from "@/lib/stores/useExperience";
import { useMessage } from "@/lib/contexts/MessageContext";
import { INTRO_MESSAGE } from "@/lib/constants/sceneMessages";

enum Controls {
    forward = "forward",
    backward = "backward",
    leftward = "leftward",
    rightward = "rightward",
}

const POSITION_EPSILON = 1e-5;
// The avatar's box geometry spans from the bottom of the legs (y = -1.3) to
// the top of the head (y = 2.4) in local units.
const MODEL_FEET_Y = -1.3;
const MODEL_HEIGHT = 3.7;
// Limbs hang from these joints so they swing from the shoulder and hip
const SHOULDER_Y = 1.1;
const HIP_Y = -0.3;
const ARM_LENGTH = 1.2;
const LEG_LENGTH = 1;
// Slight bevel so edges catch highlights like the room's models do
const EDGE_RADIUS = 0.06;

// Walk cycle, in radians per second and local model units
const STRIDE_FREQUENCY = 10;
const MAX_LIMB_SWING = 0.6;
const BOB_HEIGHT = 0.1;
const WALK_BLEND_RATE = 10;
const BREATH_FREQUENCY = 2;
// Cartoon squash and stretch, as a fraction of body height: compress as each
// foot lands, stretch at the top of the step, and swell gently when idle
const STEP_SQUASH = 0.08;
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

const Character = memo(() => {
    const characterRef = useRef<THREE.Group>(null);
    const [subscribe, getKeys] = useKeyboardControls<Controls>();
    // Subscribe only to the slices used by this component.
    const position = useMovement(state => state.position);
    const setPosition = useMovement(state => state.setPosition);
    const {
        characterSpeed,
        characterBoundary,
        characterHeight,
        characterAppearance,
        desk,
    } = useScene();
    const { message, clearMessage } = useMessage();
    // Use individual selectors to prevent unnecessary rerenders
    const mode = useExperience(state => state.mode);
    const isTransitioning = useExperience(state => state.isTransitioning);

    const allowMovement = mode === "scene" && !isTransitioning;

    let height: number,
        skinColor: string,
        shirtColor: string,
        pantsColor: string,
        featureColor: string,
        roughness: number;

    // #if DEBUG
    ({
        characterHeight: height,
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
    ({ skinColor, shirtColor, pantsColor, featureColor, roughness } =
        characterAppearance);
    // #endif

    // Scale the avatar to the configured height and lift it so its feet rest
    // on the floor. The movement store's y is the reference height used by the
    // camera and interaction boxes, so it isn't used to place the body.
    const characterScale = height / MODEL_HEIGHT;
    const bodyY = -MODEL_FEET_Y * characterScale;

    // Movement speed from context
    const speed = characterSpeed;

    // Room boundaries from context
    const boundary = characterBoundary / 2;

    // Current rotation target
    const targetRotation = useRef(0);
    const currentRotation = useRef(0);
    const hasClearedIntro = useRef(false);

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

    // Desk collision detection function
    const checkDeskCollision = (x: number, z: number) => {
        // The desk is anchored at its back-left corner
        const cornerX = desk?.position?.x ?? 0;
        const cornerZ = desk?.position?.z ?? 0;
        const footprint = desk?.footprint;
        const characterRadius = 0.5; // Character collision radius

        // Check collision with the arm of the L-desk along the back wall
        const horizX1 = cornerX;
        const horizX2 = cornerX + (footprint?.width ?? 0);
        const horizZ1 = cornerZ;
        const horizZ2 = cornerZ + (footprint?.backArmDepth ?? 0);

        // Check collision with the arm of the L-desk along the side wall
        const vertX1 = cornerX;
        const vertX2 = cornerX + (footprint?.sideArmWidth ?? 0);
        const vertZ1 = cornerZ;
        const vertZ2 = cornerZ + (footprint?.depth ?? 0);

        // Check if character overlaps with horizontal desk section
        const horizCollision =
            x + characterRadius > horizX1 &&
            x - characterRadius < horizX2 &&
            z + characterRadius > horizZ1 &&
            z - characterRadius < horizZ2;

        // Check if character overlaps with vertical desk section
        const vertCollision =
            x + characterRadius > vertX1 &&
            x - characterRadius < vertX2 &&
            z + characterRadius > vertZ1 &&
            z - characterRadius < vertZ2;

        return horizCollision || vertCollision;
    };

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
        // -1 as a foot lands, +1 at the top of the step
        const stepStretch = (stepHeight * 2 - 1) * STEP_SQUASH;
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

    // Movement and collision detection
    useFrame((state, delta) => {
        if (!characterRef.current) return;

        if (!allowMovement) {
            animateBody(false, state.clock.elapsedTime, delta);
            return;
        }

        const keys = getKeys();
        // Reuse position object to avoid creating new object every frame
        const newPosition = { x: position.x, y: position.y, z: position.z };
        let isMoving = false;

        // Calculate movement and determine rotation
        if (keys.forward) {
            newPosition.z -= speed;
            targetRotation.current = 0; // Face forward
            isMoving = true;
        }
        if (keys.backward) {
            newPosition.z += speed;
            targetRotation.current = Math.PI; // Face backward
            isMoving = true;
        }
        if (keys.leftward) {
            newPosition.x -= speed;
            targetRotation.current = Math.PI / 2; // Face left
            isMoving = true;
        }
        if (keys.rightward) {
            newPosition.x += speed;
            targetRotation.current = -Math.PI / 2; // Face right
            isMoving = true;
        }

        // Handle diagonal movement
        if (keys.forward && keys.leftward) {
            targetRotation.current = Math.PI / 4; // Northeast
        } else if (keys.forward && keys.rightward) {
            targetRotation.current = -Math.PI / 4; // Northwest
        } else if (keys.backward && keys.leftward) {
            targetRotation.current = (3 * Math.PI) / 4; // Southeast
        } else if (keys.backward && keys.rightward) {
            targetRotation.current = (-3 * Math.PI) / 4; // Southwest
        }

        // Collision detection - keep character within room boundaries
        newPosition.x = Math.max(-boundary, Math.min(boundary, newPosition.x));
        newPosition.z = Math.max(-boundary, Math.min(boundary, newPosition.z));

        // Check desk collision and revert if colliding
        if (checkDeskCollision(newPosition.x, newPosition.z)) {
            // If collision detected, don't move to new position
            newPosition.x = position.x;
            newPosition.z = position.z;
        }

        // Smooth rotation interpolation
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

            currentRotation.current += shortestDiff * 0.1; // Smooth rotation
            characterRef.current.rotation.y = currentRotation.current;
        }

        // Ignore tiny float jitter so the movement store only updates on real moves.
        const positionChanged =
            Math.abs(newPosition.x - position.x) > POSITION_EPSILON ||
            Math.abs(newPosition.y - position.y) > POSITION_EPSILON ||
            Math.abs(newPosition.z - position.z) > POSITION_EPSILON;

        if (positionChanged) {
            setPosition(newPosition);
        }

        characterRef.current.position.set(newPosition.x, bodyY, newPosition.z);
        animateBody(isMoving, state.clock.elapsedTime, delta);
    });

    return (
        <group
            ref={characterRef}
            scale={[characterScale, characterScale, characterScale]}
            position={[position.x, bodyY, position.z]}
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

                {FACE_FEATURES.map(({ position: featurePosition, size }) => (
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
                ))}

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
    );
});
Character.displayName = "Character";

export default Character;
