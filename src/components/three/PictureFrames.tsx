import { memo, useMemo } from "react";
import { RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";

type PictureFrameControls = {
    pictureFramesY: number;
    pictureFramesZ: number;
    pictureFramesScale: number;
    pictureFrameColor: string;
    pictureMatColor: string;
};

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
    } = pictureFrames;

    let pictureFramesY: number,
        pictureFramesZ: number,
        pictureFramesScale: number,
        pictureFrameColor: string,
        pictureMatColor: string;

    // #if DEBUG
    ({
        pictureFramesY,
        pictureFramesZ,
        pictureFramesScale,
        pictureFrameColor,
        pictureMatColor,
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
    // #endif

    const photoShortSide = photoLongSide / aspectRatio;
    const matDepth = frameDepth * 0.3;
    const bevel = Math.min(frameWidth, frameDepth) * 0.3;

    return (
        <group
            position={[position.x, pictureFramesY, pictureFramesZ]}
            rotation={[0, rotation.y, 0]}
            scale={pictureFramesScale}
        >
            {frames.map(({ orientation, position: slot, image }, index) => {
                const isPortrait = orientation === "portrait";
                const photoWidth = isPortrait ? photoShortSide : photoLongSide;
                const photoHeight = isPortrait ? photoLongSide : photoShortSide;
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
    );
});
PictureFrames.displayName = "PictureFrames";

export default PictureFrames;
