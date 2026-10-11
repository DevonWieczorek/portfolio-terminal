import { memo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
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

const Character = memo(() => {
    const characterRef = useRef<THREE.Group>(null);
    const [subscribe, getKeys] = useKeyboardControls<Controls>();
    // Subscribe only to the slices used by this component.
    const position = useMovement(state => state.position);
    const setPosition = useMovement(state => state.setPosition);
    const { characterSpeed, characterBoundary, characterHeight, desk } =
        useScene();
    const { message, clearMessage } = useMessage();
    // Use individual selectors to prevent unnecessary rerenders
    const mode = useExperience(state => state.mode);
    const isTransitioning = useExperience(state => state.isTransitioning);

    const allowMovement = mode === "scene" && !isTransitioning;

    let height: number;

    // #if DEBUG
    ({ characterHeight: height } = useControls(
        "Character",
        {
            characterHeight: {
                value: characterHeight,
                min: 1,
                max: 12,
                step: 0.01,
            },
        },
        { collapsed: true }
    ) as { characterHeight: number });
    // #endif

    // #if !DEBUG
    height = characterHeight;
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

    // Movement and collision detection
    useFrame(() => {
        if (!characterRef.current || !allowMovement) return;

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
    });

    return (
        <group
            ref={characterRef}
            scale={[characterScale, characterScale, characterScale]}
            position={[position.x, bodyY, position.z]}
            castShadow
        >
            {/* Head */}
            <mesh position={[0, 2, 0]} castShadow>
                <boxGeometry args={[0.8, 0.8, 0.8]} />
                <meshLambertMaterial color="#fdbcb4" />
            </mesh>

            {/* Left Eye */}
            <mesh position={[-0.15, 2.1, -0.41]} castShadow>
                <boxGeometry args={[0.1, 0.1, 0.02]} />
                <meshLambertMaterial color="#000000" />
            </mesh>

            {/* Right Eye */}
            <mesh position={[0.15, 2.1, -0.41]} castShadow>
                <boxGeometry args={[0.1, 0.1, 0.02]} />
                <meshLambertMaterial color="#000000" />
            </mesh>

            {/* Mouth */}
            <mesh position={[0, 1.9, -0.41]} castShadow>
                <boxGeometry args={[0.2, 0.05, 0.02]} />
                <meshLambertMaterial color="#000000" />
            </mesh>

            {/* Body */}
            <mesh position={[0, 0.5, 0]} castShadow>
                <boxGeometry args={[1, 1.5, 0.5]} />
                <meshLambertMaterial color="#4a90e2" />
            </mesh>

            {/* Left Arm */}
            <mesh position={[-0.8, 0.5, 0]} castShadow>
                <boxGeometry args={[0.3, 1.2, 0.3]} />
                <meshLambertMaterial color="#fdbcb4" />
            </mesh>

            {/* Right Arm */}
            <mesh position={[0.8, 0.5, 0]} castShadow>
                <boxGeometry args={[0.3, 1.2, 0.3]} />
                <meshLambertMaterial color="#fdbcb4" />
            </mesh>

            {/* Left Leg */}
            <mesh position={[-0.3, -0.8, 0]} castShadow>
                <boxGeometry args={[0.3, 1, 0.3]} />
                <meshLambertMaterial color="#2c3e50" />
            </mesh>

            {/* Right Leg */}
            <mesh position={[0.3, -0.8, 0]} castShadow>
                <boxGeometry args={[0.3, 1, 0.3]} />
                <meshLambertMaterial color="#2c3e50" />
            </mesh>
        </group>
    );
});
Character.displayName = "Character";

export default Character;
