import { memo, useCallback, useEffect, useMemo } from "react";
import { RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";
import { useMessage } from "@/lib/contexts/MessageContext";
import { useExperience, type CameraTarget } from "@/lib/stores/useExperience";
import InteractionZone, {
    type ComputeCameraTargetParams,
} from "@/components/three/InteractionZone";

type PictureFrameControls = {
    pictureFramesY: number;
    pictureFramesZ: number;
    pictureFramesScale: number;
    pictureFrameColor: string;
    pictureMatColor: string;
    inspectDistance: number;
    framesBoxSizeX: number;
    framesBoxSizeY: number;
    framesBoxSizeZ: number;
    framesBoxAnchorX: number;
    framesBoxAnchorY: number;
    framesBoxAnchorZ: number;
};

const INSPECT_MESSAGE = "Press ENTER to take a closer look at the photos.";
const EXIT_MESSAGE = "Press ESC to step back.";

interface FramePhotoProps {
    image: string;
    width: number;
    height: number;
    z: number;
}

// Crops the texture to fill the print without stretching, like CSS
// `object-fit: cover`
const coverTexture = (texture: THREE.Texture, targetAspect: number) => {
    const image = texture.image as { width?: number; height?: number } | null;
    if (!image?.width || !image.height) return;

    const imageAspect = image.width / image.height;
    const repeatX = Math.min(1, targetAspect / imageAspect);
    const repeatY = Math.min(1, imageAspect / targetAspect);
    texture.repeat.set(repeatX, repeatY);
    texture.offset.set((1 - repeatX) / 2, (1 - repeatY) / 2);
};

const FramePhoto = memo(({ image, width, height, z }: FramePhotoProps) => {
    const texture = useTexture(image);

    useMemo(() => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        coverTexture(texture, width / height);
        texture.needsUpdate = true;
    }, [texture, width, height]);

    return (
        <mesh position={[0, 0, z]} receiveShadow>
            <planeGeometry args={[width, height]} />
            <meshStandardMaterial map={texture} roughness={0.6} />
        </mesh>
    );
});
FramePhoto.displayName = "FramePhoto";

const PictureFrames = memo(() => {
    const { pictureFrames } = useScene();
    const {
        position,
        rotation,
        photoLongSide,
        aspectRatio,
        matWidth,
        frameWidth,
        frameDepth,
        emptyColor,
        frames,
        boxSize,
        boxAnchor,
    } = pictureFrames;
    const { setMessage, clearMessage } = useMessage();
    const mode = useExperience(state => state.mode);
    const isTransitioning = useExperience(state => state.isTransitioning);
    const enterInspect = useExperience(state => state.enterInspect);
    const cameraPosition = useMemo(() => new THREE.Vector3(), []);
    const lookAtPosition = useMemo(() => new THREE.Vector3(), []);

    let pictureFramesY: number,
        pictureFramesZ: number,
        pictureFramesScale: number,
        pictureFrameColor: string,
        pictureMatColor: string,
        inspectDistance: number;
    let framesBoxSizeX: number,
        framesBoxSizeY: number,
        framesBoxSizeZ: number,
        framesBoxAnchorX: number,
        framesBoxAnchorY: number,
        framesBoxAnchorZ: number;

    // #if DEBUG
    ({
        pictureFramesY,
        pictureFramesZ,
        pictureFramesScale,
        pictureFrameColor,
        pictureMatColor,
        inspectDistance,
        framesBoxSizeX,
        framesBoxSizeY,
        framesBoxSizeZ,
        framesBoxAnchorX,
        framesBoxAnchorY,
        framesBoxAnchorZ,
    } = useControls(
        "Picture Frames",
        {
            pictureFramesY: {
                value: position.y,
                min: 0,
                max: 10,
                step: 0.01,
            },
            pictureFramesZ: {
                value: position.z,
                min: -14,
                max: 14,
                step: 0.01,
            },
            pictureFramesScale: {
                value: pictureFrames.scale,
                min: 0.25,
                max: 2,
                step: 0.01,
            },
            pictureFrameColor: pictureFrames.frameColor,
            pictureMatColor: pictureFrames.matColor,
            inspectDistance: {
                value: pictureFrames.inspectDistance,
                min: 1,
                max: 20,
                step: 0.01,
            },
            framesBoxSizeX: {
                value: boxSize.x,
                min: 0.1,
                max: 20,
                step: 0.01,
            },
            framesBoxSizeY: {
                value: boxSize.y,
                min: 0.1,
                max: 20,
                step: 0.01,
            },
            framesBoxSizeZ: {
                value: boxSize.z,
                min: 0.1,
                max: 20,
                step: 0.01,
            },
            framesBoxAnchorX: {
                value: boxAnchor.x,
                min: -10,
                max: 10,
                step: 0.01,
            },
            framesBoxAnchorY: {
                value: boxAnchor.y,
                min: -10,
                max: 10,
                step: 0.01,
            },
            framesBoxAnchorZ: {
                value: boxAnchor.z,
                min: -10,
                max: 10,
                step: 0.01,
            },
        },
        { collapsed: true }
    ) as PictureFrameControls);
    // #endif

    // #if !DEBUG
    pictureFramesY = position.y;
    pictureFramesZ = position.z;
    pictureFramesScale = pictureFrames.scale;
    pictureFrameColor = pictureFrames.frameColor;
    pictureMatColor = pictureFrames.matColor;
    inspectDistance = pictureFrames.inspectDistance;
    framesBoxSizeX = boxSize.x;
    framesBoxSizeY = boxSize.y;
    framesBoxSizeZ = boxSize.z;
    framesBoxAnchorX = boxAnchor.x;
    framesBoxAnchorY = boxAnchor.y;
    framesBoxAnchorZ = boxAnchor.z;
    // #endif

    // The zone shares the gallery's origin, at the center of the frames, so
    // the camera backs straight out from the wall and looks at that center
    const computeCameraTarget = useCallback(
        ({ group }: ComputeCameraTargetParams) => {
            lookAtPosition.set(0, 0, 0);
            group.localToWorld(lookAtPosition);
            cameraPosition.set(0, 0, inspectDistance);
            group.localToWorld(cameraPosition);

            return {
                position: [
                    cameraPosition.x,
                    cameraPosition.y,
                    cameraPosition.z,
                ],
                lookAt: [lookAtPosition.x, lookAtPosition.y, lookAtPosition.z],
            } satisfies CameraTarget;
        },
        [cameraPosition, inspectDistance, lookAtPosition]
    );

    const handleEnter = useCallback(
        (target?: CameraTarget) => {
            if (target) {
                enterInspect(target);
            }
        },
        [enterInspect]
    );

    // The zone's own message hides outside the scene, so this one takes over
    // once the camera has settled on the photos
    const isInspecting = mode === "inspect" && !isTransitioning;
    useEffect(() => {
        if (!isInspecting) {
            return;
        }

        setMessage(EXIT_MESSAGE);
        return () => clearMessage(EXIT_MESSAGE);
    }, [clearMessage, isInspecting, setMessage]);

    const photoShortSide = photoLongSide / aspectRatio;
    const matDepth = frameDepth * 0.3;
    const bevel = Math.min(frameWidth, frameDepth) * 0.3;

    return (
        <group
            position={[position.x, pictureFramesY, pictureFramesZ]}
            rotation={[0, rotation.y, 0]}
        >
            <InteractionZone
                message={INSPECT_MESSAGE}
                size={[framesBoxSizeX, framesBoxSizeY, framesBoxSizeZ]}
                center={[framesBoxAnchorX, framesBoxAnchorY, framesBoxAnchorZ]}
                onEnter={handleEnter}
                computeCameraTarget={computeCameraTarget}
            />
            <group scale={pictureFramesScale}>
                {frames.map(({ orientation, position: slot, image }, index) => {
                    const isPortrait = orientation === "portrait";
                    const photoWidth = isPortrait
                        ? photoShortSide
                        : photoLongSide;
                    const photoHeight = isPortrait
                        ? photoLongSide
                        : photoShortSide;
                    const innerWidth = photoWidth + matWidth * 2;
                    const innerHeight = photoHeight + matWidth * 2;
                    const outerWidth = innerWidth + frameWidth * 2;
                    const photoZ = matDepth + 0.002;

                    // Top and bottom rails span the full width; the stiles fit
                    // between them
                    const rails: [Coordinate, Coordinate][] = [
                        [
                            [outerWidth, frameWidth, frameDepth],
                            [0, (innerHeight + frameWidth) / 2, 0],
                        ],
                        [
                            [outerWidth, frameWidth, frameDepth],
                            [0, -(innerHeight + frameWidth) / 2, 0],
                        ],
                        [
                            [frameWidth, innerHeight, frameDepth],
                            [-(innerWidth + frameWidth) / 2, 0, 0],
                        ],
                        [
                            [frameWidth, innerHeight, frameDepth],
                            [(innerWidth + frameWidth) / 2, 0, 0],
                        ],
                    ];

                    return (
                        <group key={index} position={[slot.x, slot.y, 0]}>
                            {rails.map(([size, [x, y]], railIndex) => (
                                <RoundedBox
                                    key={railIndex}
                                    args={size}
                                    radius={bevel}
                                    smoothness={2}
                                    position={[x, y, frameDepth / 2]}
                                    castShadow
                                    receiveShadow
                                >
                                    <meshStandardMaterial
                                        color={pictureFrameColor}
                                        roughness={0.75}
                                    />
                                </RoundedBox>
                            ))}
                            {/* Recessed behind the frame's front face */}
                            <mesh position={[0, 0, matDepth / 2]} receiveShadow>
                                <boxGeometry
                                    args={[innerWidth, innerHeight, matDepth]}
                                />
                                <meshStandardMaterial
                                    color={pictureMatColor}
                                    roughness={0.9}
                                />
                            </mesh>
                            {image ? (
                                <FramePhoto
                                    image={image}
                                    width={photoWidth}
                                    height={photoHeight}
                                    z={photoZ}
                                />
                            ) : (
                                <mesh position={[0, 0, photoZ]} receiveShadow>
                                    <planeGeometry
                                        args={[photoWidth, photoHeight]}
                                    />
                                    <meshStandardMaterial
                                        color={emptyColor}
                                        roughness={0.85}
                                    />
                                </mesh>
                            )}
                        </group>
                    );
                })}
            </group>
        </group>
    );
});
PictureFrames.displayName = "PictureFrames";

export default PictureFrames;
