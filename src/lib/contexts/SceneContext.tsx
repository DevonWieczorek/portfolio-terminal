import React, { createContext, useContext, ReactNode } from "react";

interface ObjectTraits {
    width: number;
    height: number;
    thickness: number;
    scale: number;
    spacing: number;
    color: string;
    position: Coordinates;
    rotation: Coordinates;
    boxSize: Coordinates;
    boxAnchor: Coordinates;
    approachYawOffset: number;
    footprint: Footprint;
}

// Light sources (screens) rendered in HDR so they bloom
interface GlowTraits {
    intensity: number; // HDR multiplier; values above the bloom threshold glow
}

interface LightingSettings {
    brightness: number; // multiplier applied to every light in the room
    temperature: number; // color temperature in Kelvin; lower is warmer
    fixtures: Coordinates[]; // ceiling-mounted light positions
    environmentIntensity: number; // strength of reflections on PBR materials
}

// Cartoon avatar palette, shaded with the same PBR lighting as the room
interface CharacterAppearance {
    skinColor: string;
    shirtColor: string;
    pantsColor: string;
    featureColor: string; // eyes and mouth
    roughness: number;
}

interface EffectsSettings {
    bloomIntensity: number;
    bloomThreshold: number;
    bloomSmoothing: number;
    aoIntensity: number;
    aoRadius: number; // world-space reach of the contact shadowing
    vignetteOffset: number; // how far in from the edges the darkening starts
    vignetteDarkness: number;
}

// Floor footprint of an L-shaped object anchored at its back-left corner
interface Footprint {
    width: number; // along the back wall
    depth: number; // along the side wall
    backArmDepth: number; // depth of the arm against the back wall
    sideArmWidth: number; // width of the arm against the side wall
}

interface RoomDimensions {
    width: number; // feet
    depth: number; // feet
    height: number; // feet
    wallThickness: number;
    interiorWidth: number;
    interiorDepth: number;
}

// Texture set and tiling for a room surface (floor, walls). Normal and
// roughness maps are optional; without a roughness map, `roughness` applies
// evenly across the surface.
// One straight run of trim along a wall's interior face
interface WallRun {
    position: Coordinates;
    length: number;
    rotationY: number; // turns the run's local +Z to face into the room
}

interface BaseboardTraits {
    runs: WallRun[];
    height: number;
    thickness: number;
    color: string;
}

// Rectangular rug lying on the floor, with a contrasting border
interface RugTraits {
    position: { x: number; z: number };
    width: number; // along the x axis
    depth: number; // along the z axis
    borderWidth: number;
    color: string;
    borderColor: string;
}

interface SurfaceTraits {
    textures: {
        map: string;
        normalMap?: string;
        roughnessMap?: string;
    };
    tileSize: number; // feet covered by one repeat of the texture
    roughness: number;
    normalScale: number;
}

// Flat-painted ceiling with no texture. It sits above every light, so
// `bounce` self-illuminates it to stand in for light reflected up off the room.
interface CeilingTraits {
    color: string;
    roughness: number;
    bounce: number;
}

interface Rotations {
    clockwise: number;
    counterclockwise: number;
}

const ROOM_SIZE: number = 30;
const ROOM_WIDTH: number = ROOM_SIZE;
const ROOM_DEPTH: number = ROOM_SIZE;
const ROOM_HEIGHT: number = 12;
const WALL_THICKNESS: number = 1;

const roomDimensions: RoomDimensions = {
    width: ROOM_WIDTH,
    depth: ROOM_DEPTH,
    height: ROOM_HEIGHT,
    wallThickness: WALL_THICKNESS,
    // Interior dimensions (usable space)
    interiorWidth: ROOM_WIDTH - WALL_THICKNESS * 2,
    interiorDepth: ROOM_DEPTH - WALL_THICKNESS * 2,
};

const rotationY: Rotations = {
    clockwise: -Math.PI / 2,
    counterclockwise: Math.PI / 2,
};

// One meter in feet, for textures authored at real-world scale
const METER: number = 3.281;

// Oak planks: one tile is ~2m x 2m (8 planks)
const defaultFloorSurface: SurfaceTraits = {
    textures: {
        map: "/textures/floor_albedo.jpg",
    },
    tileSize: 1.5 * METER,
    roughness: 0.35,
    normalScale: 1,
};

// Eggshell plaster: one tile is ~1m x 1m. The albedo is near-white so
// `wallColor` tints it.
const defaultWallSurface: SurfaceTraits = {
    textures: {
        map: "/textures/wall_albedo.jpg",
    },
    tileSize: METER,
    roughness: 0.35,
    normalScale: 1,
};

// Scale factor based on INTERIOR room size vs standard interior (28x28x12)
const STANDARD_INTERIOR = 28; // 30 - (1 * 2) = 28 feet interior
const scaleFactorXZ =
    Math.min(roomDimensions.interiorWidth, roomDimensions.interiorDepth) /
    STANDARD_INTERIOR;
const scaleFactorY = ROOM_HEIGHT / 12;

// Conversion functions that auto-scale with room size
const scaledFeet = (feetValue: number) => feetValue * scaleFactorXZ;
const scaledHeight = (feetValue: number) => feetValue * scaleFactorY;

// Position helpers that work with interior space
const feetFromCenter = (feetValue: number) => feetValue;
const feetFromFloor = (feetValue: number) => feetValue;

// Interior faces of the walls, matching the wall geometry in Room.tsx
// (walls are centered on the room edge, so half their thickness is inside)
const wallFaces = {
    left: -ROOM_WIDTH / 2 + WALL_THICKNESS / 2,
    right: ROOM_WIDTH / 2 - WALL_THICKNESS / 2,
    back: -ROOM_DEPTH / 2 + WALL_THICKNESS / 2,
    front: ROOM_DEPTH / 2 - WALL_THICKNESS / 2,
};

// Chunky, oversized trim along every wall for a cartoon look. Each run spans
// its wall's full interior length and sits flush against the wall face.
const BASEBOARD_HEIGHT: number = scaledHeight(0.6);
const BASEBOARD_THICKNESS: number = scaledFeet(0.15);
const RUN_X: number = wallFaces.right - wallFaces.left;
const RUN_Z: number = wallFaces.front - wallFaces.back;
const defaultBaseboardTraits: BaseboardTraits = {
    runs: [
        {
            position: { x: 0, y: 0, z: wallFaces.back },
            length: RUN_X,
            rotationY: 0,
        },
        {
            position: { x: 0, y: 0, z: wallFaces.front },
            length: RUN_X,
            rotationY: Math.PI,
        },
        {
            position: { x: wallFaces.left, y: 0, z: 0 },
            length: RUN_Z,
            rotationY: rotationY.counterclockwise,
        },
        {
            position: { x: wallFaces.right, y: 0, z: 0 },
            length: RUN_Z,
            rotationY: rotationY.clockwise,
        },
    ],
    height: BASEBOARD_HEIGHT,
    thickness: BASEBOARD_THICKNESS,
    color: "#FFFDF7",
};

// Centered under the character's starting spot
const defaultRugTraits: RugTraits = {
    position: { x: 0, z: 0 },
    width: scaledFeet(15),
    depth: scaledFeet(10),
    borderWidth: scaledFeet(0.6),
    // Muted sage-teal with a slate border: cool against the warm wood floor
    // without competing with the character's saturated clothing
    color: "#6FA3A0",
    borderColor: "#34506B",
};

// Desk top height (a standard desk is ~30in tall)
const DESK_HEIGHT: number = scaledHeight(2.5);
// L-desk footprint as multiples of its top height. Must match DESK in
// .bin/generate-scene-models.mts, which builds cartoon_desk.glb.
const DESK_PROPORTIONS: Footprint = {
    width: 2.566,
    depth: 2.258,
    backArmDepth: 0.846,
    sideArmWidth: 0.909,
};
const defaultDeskTraits: DeepPartial<ObjectTraits> = {
    scale: DESK_HEIGHT,
    // The desk is anchored at its back-left corner, so this tucks it into the
    // back-left corner of the room, pressed against the baseboards rather than
    // the walls so its legs don't sink into the trim
    position: {
        x: wallFaces.left + BASEBOARD_THICKNESS,
        y: feetFromFloor(0),
        z: wallFaces.back + BASEBOARD_THICKNESS,
    },
    footprint: {
        width: DESK_PROPORTIONS.width * DESK_HEIGHT,
        depth: DESK_PROPORTIONS.depth * DESK_HEIGHT,
        backArmDepth: DESK_PROPORTIONS.backArmDepth * DESK_HEIGHT,
        sideArmWidth: DESK_PROPORTIONS.sideArmWidth * DESK_HEIGHT,
    },
};

// Monitor height in feet
const MONITOR_SCALE: number = scaledHeight(1.5);
// Screen glass in the monitor model's own units (1 unit tall, centered, facing
// +Z). Must match MONITOR_SCREEN in .bin/generate-scene-models.mts.
const MONITOR_GLASS = {
    centerY: 0.1,
    width: 0.74,
    height: 0.58,
    frontZ: 0.425,
};
// Monitor is positioned relative to the desk's back-left corner; the model is
// centered, so lifting it by half its height stands it on the desk top
const defaultMonitorTraits: DeepPartial<ObjectTraits> = {
    scale: MONITOR_SCALE,
    position: {
        x: scaledFeet(2),
        y: DESK_HEIGHT + MONITOR_SCALE / 2,
        z: scaledFeet(1.4),
    },
    rotation: {
        // Angled out of the corner toward the middle of the room
        y: 0.57,
    },
    boxSize: {
        x: 10,
        y: 6,
        z: 6,
    },
    // The camera flies in toward this point, so it's the center of the glass
    boxAnchor: {
        x: 0,
        y: MONITOR_GLASS.centerY * MONITOR_SCALE,
        z: MONITOR_GLASS.frontZ * MONITOR_SCALE,
    },
    approachYawOffset: 0,
};

// Screen overlay in the monitor model's own units, sitting just in front of the
// glass and inset so its square corners stay inside the glass's rounded ones
const SCREEN_INSET = 0.02;
const defaultMonitorScreenTraits: DeepPartial<ObjectTraits & GlowTraits> = {
    width: MONITOR_GLASS.width - SCREEN_INSET * 2,
    height: MONITOR_GLASS.height - SCREEN_INSET * 2,
    position: {
        x: 0,
        y: MONITOR_GLASS.centerY,
        z: MONITOR_GLASS.frontZ + 0.002,
    },
    rotation: {
        x: 0,
        y: 0,
    },
    color: "#00ff00",
    intensity: 1.6,
};

// Overhead lighting: a 2x2 grid of ceiling fixtures, each centered in a
// quadrant of the room, at a soft warm-white color temperature
const FIXTURE_Y: number = scaledHeight(ROOM_HEIGHT - 0.5);
const FIXTURE_SPREAD: number = scaledFeet(7);
const defaultLightingSettings: LightingSettings = {
    brightness: 1.35,
    temperature: 5600,
    environmentIntensity: 0.2,
    fixtures: [-1, 1].flatMap(x =>
        [-1, 1].map(z => ({
            x: x * FIXTURE_SPREAD,
            y: FIXTURE_Y,
            z: z * FIXTURE_SPREAD,
        }))
    ),
};

// Only HDR colors (LEDs, screens) should exceed the threshold, so regular lit
// surfaces never bloom
const defaultEffectsSettings: EffectsSettings = {
    bloomIntensity: 1.2,
    bloomThreshold: 0.65,
    bloomSmoothing: 0.3,
    aoIntensity: 1.5,
    aoRadius: 1.25,
    vignetteOffset: 0.3,
    vignetteDarkness: 0.45,
};

// Bass height (a full-scale bass is ~46in tall)
const BASS_SCALE: number = scaledFeet(3.8);
const defaultBassTraits: DeepPartial<ObjectTraits> = {
    position: {
        x: feetFromCenter(-1 * scaleFactorXZ),
        y: scaledHeight((ROOM_HEIGHT - BASS_SCALE) / 2),
        z: wallFaces.back,
    },
    scale: BASS_SCALE,
    spacing: scaledFeet(5),
    boxSize: {
        x: 15,
        y: 18,
        z: 5,
    },
    boxAnchor: {
        x: 1,
        y: 0,
        z: 0,
    },
};

// const NUM_DECKS: number = 4;
// Deck length (a standard deck is ~32in long)
const DECK_SCALE: number = scaledFeet(2.67);
const defaultDeckTraits: DeepPartial<ObjectTraits> = {
    position: {
        x: wallFaces.right,
        // Decks are centered on their origin, so this lines them up with the
        // vertical center of the basses
        y: scaledHeight(ROOM_HEIGHT / 2),
        z: feetFromCenter(-1 * scaleFactorXZ),
    },
    scale: DECK_SCALE,
    spacing: scaledFeet(5),
    boxSize: {
        x: 20,
        y: 12,
        z: 5,
    },
    boxAnchor: {
        x: 0,
        y: 0,
        z: 0,
    },
};

// Scene configuration interface
interface SceneConfig {
    rotations: Rotations;
    roomSize: number;
    wallColor: string;
    wallHeight: number;
    wallThickness: number;
    floorSurface: SurfaceTraits;
    wallSurface: SurfaceTraits;
    ceilingSurface: CeilingTraits;
    baseboard: BaseboardTraits;
    rug: RugTraits;
    characterBoundary: number;
    cameraBuffer: number;
    characterSpeed: number;
    characterStepSquash: number; // squash and stretch per step, as a fraction of body height
    characterHeight: number;
    cameraPanSpeed: number;
    cameraRotateSpeed: number;
    characterAppearance: CharacterAppearance;
    cameraOffset: {
        x: number;
        y: number;
        z: number;
    };
    cameraLookAtHeight: number; // how far above the character the camera aims
    zoomSettings: {
        min: number;
        max: number;
        speed: number;
        default: number;
    };
    desk: DeepPartial<ObjectTraits>;
    monitor: DeepPartial<ObjectTraits>;
    monitorScreen: DeepPartial<ObjectTraits & GlowTraits>;
    lighting: LightingSettings;
    effects: EffectsSettings;
    bass: DeepPartial<ObjectTraits>;
    deck: DeepPartial<ObjectTraits>;
    // Milliseconds the loading screen stays up, even if the room is ready
    loaderMinDuration: number;
}

// Default scene configuration
const defaultSceneConfig: SceneConfig = {
    rotations: rotationY,
    roomSize: ROOM_SIZE,
    wallColor: "#F2F0E8",
    wallHeight: ROOM_HEIGHT,
    wallThickness: WALL_THICKNESS,
    floorSurface: defaultFloorSurface,
    wallSurface: defaultWallSurface,
    ceilingSurface: {
        color: "#F7F6F2",
        roughness: 0.9,
        bounce: 0.4,
    },
    baseboard: defaultBaseboardTraits,
    rug: defaultRugTraits,
    characterHeight: scaledHeight(6),
    characterAppearance: {
        skinColor: "#fccfaf",
        shirtColor: "#269dff",
        pantsColor: "#091634",
        featureColor: "#000",
        roughness: 0.75,
    },
    characterBoundary: ROOM_SIZE - 2.25,
    cameraBuffer: 2,
    characterSpeed: 0.15,
    characterStepSquash: 0.04,
    cameraPanSpeed: 0.2,
    cameraRotateSpeed: 0.03,
    // Low and aimed above the character so the far wall (and the basses on
    // it) stays in frame instead of the camera looking down at the floor
    cameraOffset: {
        x: 0,
        y: 5,
        z: 18,
    },
    cameraLookAtHeight: 3.5,
    zoomSettings: {
        min: 0.5,
        max: 2,
        speed: 0.1,
        default: 1,
    },
    desk: defaultDeskTraits,
    monitor: defaultMonitorTraits,
    monitorScreen: defaultMonitorScreenTraits,
    lighting: defaultLightingSettings,
    effects: defaultEffectsSettings,
    bass: defaultBassTraits,
    deck: defaultDeckTraits,
    loaderMinDuration: 5000,
};

// Context
const SceneContext = createContext<SceneConfig | undefined>(undefined);

// Provider component
interface SceneProviderProps {
    children: ReactNode;
    config?: Partial<SceneConfig>;
}

export function SceneProvider({ children, config = {} }: SceneProviderProps) {
    const sceneConfig = { ...defaultSceneConfig, ...config };

    return (
        <SceneContext.Provider value={sceneConfig}>
            {children}
        </SceneContext.Provider>
    );
}

// Hook to use scene config
export function useScene(): SceneConfig {
    const context = useContext(SceneContext);
    if (context === undefined) {
        throw new Error("useScene must be used within a SceneProvider");
    }
    return context;
}
