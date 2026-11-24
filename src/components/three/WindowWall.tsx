import { memo, useEffect, useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";
import { useLocalHour } from "@/hooks/use-local-hour";
import type { SurfaceTextures } from "@/hooks/use-surface-textures";
import { getSunDirection, getWindowSunlight } from "@/utils/sun";
import { kelvinToColor } from "@/utils/color";
import Sky from "@/components/three/Sky";

type Vec3 = [number, number, number];

type WindowControls = {
    windowX: number;
    windowY: number;
    windowWidth: number;
    windowHeight: number;
    casingWidth: number;
    casingDepth: number;
    jambThickness: number;
    mullionWidth: number;
    sillDepth: number;
    sillThickness: number;
    trimColor: string;
};

type DayCycleControls = {
    followClock: boolean;
    hour: number;
    sunrise: number;
    sunset: number;
    maxSunElevation: number;
    sunIntensity: number;
    sunDistance: number;
};

interface WindowWallProps {
    // The room's wall textures. They're cloned here, since this wall tiles
    // them in world units rather than once per face.
    textures: SurfaceTextures;
    tileSize: number;
    roughness: number;
    normalScale: number;
    color: string;
}

const TRIM_ROUGHNESS = 0.8;
const TRIM_BEVEL = 0.04;
// Sun color from low (warm) to high (near neutral), blended toward white the
// same way the room lights are so it never reads as heavy amber
const LOW_SUN_TEMPERATURE = 3200;
const HIGH_SUN_TEMPERATURE = 5600;
const SUN_WARMTH_STRENGTH = 0.5;
const WHITE = new THREE.Color("#ffffff");
// Extra spread on the sun's cone past the window's corners
const CONE_MARGIN = 1.5;
// Gap between the wall and the shadow-only occluder outside it. The ceiling
// key light shines in at a slight angle; this keeps the occluder's own
// shadow from that light on the far side of the wall.
const OCCLUDER_GAP = 1.5;
// Keeps the occluder from flying off when the sun runs along the wall
const MIN_SUN_FACING = 0.05;
// The sun is already off by the time the occluder would shrink this far
const MIN_OCCLUDER_SCALE = 0.1;

type TrimProps = { size: Vec3; position: Vec3; color: string };

const Trim = ({ size, position, color }: TrimProps) => (
    <RoundedBox
        args={size}
        radius={Math.min(TRIM_BEVEL, Math.min(...size) * 0.4)}
        smoothness={3}
        position={position}
        castShadow
        receiveShadow
    >
        <meshStandardMaterial color={color} roughness={TRIM_ROUGHNESS} />
    </RoundedBox>
);

// A rectangle with a rectangular hole, both centered on the origin
const rectWithHole = (
    outerWidth: number,
    outerHeight: number,
    holeWidth: number,
    holeHeight: number,
    holeCenter: [number, number] = [0, 0]
) => {
    const shape = new THREE.Shape();
    shape.moveTo(-outerWidth / 2, -outerHeight / 2);
    shape.lineTo(outerWidth / 2, -outerHeight / 2);
    shape.lineTo(outerWidth / 2, outerHeight / 2);
    shape.lineTo(-outerWidth / 2, outerHeight / 2);
    shape.closePath();

    const [cx, cy] = holeCenter;
    const hole = new THREE.Path();
    hole.moveTo(cx - holeWidth / 2, cy - holeHeight / 2);
    hole.lineTo(cx - holeWidth / 2, cy + holeHeight / 2);
    hole.lineTo(cx + holeWidth / 2, cy + holeHeight / 2);
    hole.lineTo(cx + holeWidth / 2, cy - holeHeight / 2);
    hole.closePath();
    shape.holes.push(hole);

    return shape;
};

const WindowWall = memo(function WindowWall({
    textures,
    tileSize,
    roughness,
    normalScale,
    color,
}: WindowWallProps) {
    const { roomSize, wallHeight, wallThickness, roomWindow, dayCycle } =
        useScene();
    const localHour = useLocalHour();

    let windowX: number,
        windowY: number,
        windowWidth: number,
        windowHeight: number,
        casingWidth: number,
        casingDepth: number,
        jambThickness: number,
        mullionWidth: number,
        sillDepth: number,
        sillThickness: number,
        trimColor: string;
    let hour: number,
        sunrise: number,
        sunset: number,
        maxSunElevation: number,
        sunIntensity: number,
        sunDistance: number;

    // #if DEBUG
    ({
        windowX,
        windowY,
        windowWidth,
        windowHeight,
        casingWidth,
        casingDepth,
        jambThickness,
        mullionWidth,
        sillDepth,
        sillThickness,
        trimColor,
    } = useControls(
        "Window",
        {
            windowX: {
                value: roomWindow.position.x,
                min: -14,
                max: 14,
                step: 0.01,
            },
            windowY: {
                value: roomWindow.position.y,
                min: 0,
                max: 12,
                step: 0.01,
            },
            windowWidth: {
                value: roomWindow.width,
                min: 1,
                max: 20,
                step: 0.01,
            },
            windowHeight: {
                value: roomWindow.height,
                min: 1,
                max: 10,
                step: 0.01,
            },
            casingWidth: {
                value: roomWindow.casingWidth,
                min: 0.05,
                max: 1.5,
                step: 0.01,
            },
            casingDepth: {
                value: roomWindow.casingDepth,
                min: 0.02,
                max: 0.5,
                step: 0.01,
            },
            jambThickness: {
                value: roomWindow.jambThickness,
                min: 0.02,
                max: 0.5,
                step: 0.01,
            },
            mullionWidth: {
                value: roomWindow.mullionWidth,
                min: 0.05,
                max: 0.6,
                step: 0.01,
            },
            sillDepth: {
                value: roomWindow.sillDepth,
                min: 0,
                max: 2,
                step: 0.01,
            },
            sillThickness: {
                value: roomWindow.sillThickness,
                min: 0.05,
                max: 0.6,
                step: 0.01,
            },
            trimColor: roomWindow.color,
        },
        { collapsed: true }
    ) as WindowControls);

    const timeOfDay = useControls(
        "Time of Day",
        {
            followClock: { value: true, label: "follow clock" },
            hour: {
                value: 12,
                min: 0,
                max: 24,
                step: 0.05,
                render: get => !get("Time of Day.followClock"),
            },
            sunrise: { value: dayCycle.sunrise, min: 0, max: 12, step: 0.25 },
            sunset: { value: dayCycle.sunset, min: 12, max: 24, step: 0.25 },
            maxSunElevation: {
                value: dayCycle.maxSunElevation,
                min: 0.1,
                max: Math.PI / 2,
                step: 0.01,
            },
            sunIntensity: {
                value: dayCycle.sunIntensity,
                min: 0,
                max: 10,
                step: 0.05,
            },
            sunDistance: {
                value: dayCycle.sunDistance,
                min: 10,
                max: 50,
                step: 0.5,
            },
        },
        { collapsed: true }
    ) as DayCycleControls;
    ({ sunrise, sunset, maxSunElevation, sunIntensity, sunDistance } =
        timeOfDay);
    hour = timeOfDay.followClock ? localHour : timeOfDay.hour;
    // #endif

    // #if !DEBUG
    windowX = roomWindow.position.x;
    windowY = roomWindow.position.y;
    windowWidth = roomWindow.width;
    windowHeight = roomWindow.height;
    casingWidth = roomWindow.casingWidth;
    casingDepth = roomWindow.casingDepth;
    jambThickness = roomWindow.jambThickness;
    mullionWidth = roomWindow.mullionWidth;
    sillDepth = roomWindow.sillDepth;
    sillThickness = roomWindow.sillThickness;
    trimColor = roomWindow.color;
    hour = localHour;
    ({ sunrise, sunset, maxSunElevation, sunIntensity, sunDistance } =
        dayCycle);
    // #endif

    const interiorZ = roomSize / 2 - wallThickness / 2;
    const exteriorZ = interiorZ + wallThickness;

    // Extruded from a shape in world X/Y, so its faces' UVs are world units
    const wallGeometry = useMemo(() => {
        const shape = rectWithHole(
            roomSize,
            wallHeight,
            windowWidth,
            windowHeight,
            [windowX, windowY - wallHeight / 2]
        );
        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: wallThickness,
            bevelEnabled: false,
        });
        geometry.translate(0, wallHeight / 2, 0);
        return geometry;
    }, [
        roomSize,
        wallHeight,
        wallThickness,
        windowX,
        windowY,
        windowWidth,
        windowHeight,
    ]);

    useEffect(() => () => wallGeometry.dispose(), [wallGeometry]);

    // Clones share the loaded image, so this costs no extra download or upload
    const wallTextures = useMemo(
        () =>
            Object.fromEntries(
                Object.entries(textures).map(([key, texture]) => [
                    key,
                    texture.clone(),
                ])
            ) as SurfaceTextures,
        [textures]
    );

    useEffect(() => {
        Object.values(wallTextures).forEach((texture: THREE.Texture) => {
            texture.repeat.set(1 / tileSize, 1 / tileSize);
            texture.needsUpdate = true;
        });
    }, [wallTextures, tileSize]);

    useEffect(
        () => () =>
            Object.values(wallTextures).forEach((texture: THREE.Texture) =>
                texture.dispose()
            ),
        [wallTextures]
    );

    const sunDirection = useMemo(
        () =>
            getSunDirection(
                hour,
                { sunrise, sunset, maxElevation: maxSunElevation },
                new THREE.Vector3()
            ),
        [hour, sunrise, sunset, maxSunElevation]
    );

    // Trim pieces in the window's frame, where +Z points into the room and
    // the wall runs from z = 0 back to z = -wallThickness
    const halfWidth = windowWidth / 2;
    const halfHeight = windowHeight / 2;
    const casingOuterWidth = windowWidth + casingWidth * 2;
    const sillLength = sillDepth + wallThickness;
    const trim: Omit<TrimProps, "color">[] = [
        // Jambs line the opening so the cut edges of the wall never show
        {
            size: [jambThickness, windowHeight, wallThickness],
            position: [-halfWidth + jambThickness / 2, 0, -wallThickness / 2],
        },
        {
            size: [jambThickness, windowHeight, wallThickness],
            position: [halfWidth - jambThickness / 2, 0, -wallThickness / 2],
        },
        {
            size: [windowWidth, jambThickness, wallThickness],
            position: [0, halfHeight - jambThickness / 2, -wallThickness / 2],
        },
        // Casing on the wall's face
        {
            size: [casingWidth, windowHeight + casingWidth, casingDepth],
            position: [
                -halfWidth - casingWidth / 2,
                casingWidth / 2,
                casingDepth / 2,
            ],
        },
        {
            size: [casingWidth, windowHeight + casingWidth, casingDepth],
            position: [
                halfWidth + casingWidth / 2,
                casingWidth / 2,
                casingDepth / 2,
            ],
        },
        {
            size: [casingOuterWidth, casingWidth, casingDepth],
            position: [0, halfHeight + casingWidth / 2, casingDepth / 2],
        },
        // Sill, running through the wall and out into the room, so it also
        // lines the bottom of the opening, with an apron below
        {
            size: [
                casingOuterWidth + casingDepth * 2,
                sillThickness,
                sillLength,
            ],
            position: [
                0,
                -halfHeight - sillThickness / 2,
                sillDepth - sillLength / 2,
            ],
        },
        {
            size: [casingOuterWidth, casingWidth, casingDepth],
            position: [
                0,
                -halfHeight - sillThickness - casingWidth / 2,
                casingDepth / 2,
            ],
        },
        // Mullions splitting the opening into four panes
        {
            size: [mullionWidth, windowHeight, mullionWidth],
            position: [0, 0, -wallThickness / 2],
        },
        {
            size: [windowWidth, mullionWidth, mullionWidth],
            position: [0, 0, -wallThickness / 2],
        },
    ];

    return (
        <>
            <mesh
                geometry={wallGeometry}
                position={[0, 0, interiorZ]}
                receiveShadow
            >
                <meshStandardMaterial
                    {...wallTextures}
                    roughness={roughness}
                    normalScale={[normalScale, normalScale]}
                    color={color}
                />
            </mesh>

            {/* Turned so +Z points into the room */}
            <group
                position={[windowX, windowY, interiorZ]}
                rotation-y={Math.PI}
            >
                {trim.map(({ size, position }, i) => (
                    <Trim
                        // The list is fixed, and the mullions share a center
                        key={i}
                        size={size}
                        position={position}
                        color={trimColor}
                    />
                ))}
            </group>

            <Sky sunDirection={sunDirection} />
            <Sunlight
                sunDirection={sunDirection}
                intensity={sunIntensity * getWindowSunlight(sunDirection)}
                distance={sunDistance}
                center={[windowX, windowY, interiorZ]}
                width={windowWidth}
                height={windowHeight}
                occluderZ={exteriorZ + OCCLUDER_GAP}
            />
        </>
    );
});
WindowWall.displayName = "WindowWall";

interface SunlightProps {
    sunDirection: THREE.Vector3;
    intensity: number;
    distance: number;
    center: Vec3; // middle of the opening, on the wall's interior face
    width: number;
    height: number;
    occluderZ: number;
}

// Sunlight streaming in through the window. A spotlight far out along the
// sun's direction aims its cone through the opening. The walls don't cast
// shadows (from the ceiling key light they'd shade a strip of the floor), so
// an invisible screen with a window-shaped hole sits outside and shapes the
// beam instead. The mullions cast the pane pattern onto the floor.
const Sunlight = memo(function Sunlight({
    sunDirection,
    intensity,
    distance,
    center,
    width,
    height,
    occluderZ,
}: SunlightProps) {
    const target = useMemo(() => new THREE.Object3D(), []);
    const [cx, cy, cz] = center;
    const reach = Math.hypot(width, height) / 2 + CONE_MARGIN;
    const angle = Math.atan(reach / distance);

    const color = useMemo(() => {
        const height = THREE.MathUtils.smoothstep(sunDirection.y, 0, 0.5);
        const temperature = THREE.MathUtils.lerp(
            LOW_SUN_TEMPERATURE,
            HIGH_SUN_TEMPERATURE,
            height
        );
        return WHITE.clone().lerp(
            kelvinToColor(temperature),
            SUN_WARMTH_STRENGTH
        );
    }, [sunDirection]);

    // Where the line from the window to the sun crosses the occluder's plane
    const facing = Math.max(sunDirection.z, MIN_SUN_FACING);
    const along = (occluderZ - cz) / facing;
    const occluderPosition: Vec3 = [
        cx + sunDirection.x * along,
        cy + sunDirection.y * along,
        occluderZ,
    ];
    // The sun is a spotlight a finite distance away, so its rays spread out.
    // A window-sized hole out at the occluder would cast a beam larger than
    // the opening, and the extra would shine through the wall, which casts
    // no shadow. The occluder's plane is parallel to the wall, so shrinking
    // it by the ratio of their distances from the light lines the hole's
    // shadow up exactly with the opening.
    const occluderScale = Math.max(
        1 - (occluderZ - cz) / (facing * distance),
        MIN_OCCLUDER_SCALE
    );

    const occluderGeometry = useMemo(
        () =>
            new THREE.ShapeGeometry(
                rectWithHole(
                    width + reach * 4,
                    height + reach * 4,
                    width,
                    height
                )
            ),
        [width, height, reach]
    );

    useEffect(() => () => occluderGeometry.dispose(), [occluderGeometry]);

    return (
        <>
            {/* The sun is effectively infinitely far, so its light doesn't
                fall off with distance. It stays on (at zero) overnight, since
                removing a shadow-casting light recompiles every material. */}
            <spotLight
                position={[
                    cx + sunDirection.x * distance,
                    cy + sunDirection.y * distance,
                    cz + sunDirection.z * distance,
                ]}
                target={target}
                color={color}
                intensity={intensity}
                angle={angle}
                penumbra={0.2}
                decay={0}
                castShadow
                shadow-mapSize={[1024, 1024]}
                shadow-camera-near={distance / 2}
                shadow-camera-far={distance * 3}
                shadow-bias={-0.0005}
                shadow-normalBias={0.02}
            />
            <primitive object={target} position={center} />

            {/* Writes neither color nor depth, so it's invisible and doesn't
                hide the sky, but it still renders into shadow maps */}
            <mesh
                geometry={occluderGeometry}
                position={occluderPosition}
                scale={[occluderScale, occluderScale, 1]}
                castShadow
            >
                <meshBasicMaterial
                    colorWrite={false}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </>
    );
});
Sunlight.displayName = "Sunlight";

export default WindowWall;
