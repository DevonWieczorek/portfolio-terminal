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

interface EffectsSettings {
    bloomIntensity: number;
    bloomThreshold: number;
    bloomSmoothing: number;
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

// Desk top height (a standard desk is ~30in tall)
const DESK_HEIGHT: number = scaledHeight(2.5);
// L-desk footprint as multiples of its top height, measured from l_shaped_desk.glb
const DESK_PROPORTIONS: Footprint = {
    width: 2.566,
    depth: 2.258,
    backArmDepth: 0.846,
    sideArmWidth: 0.909,
};
const defaultDeskTraits: DeepPartial<ObjectTraits> = {
    scale: DESK_HEIGHT,
    // The desk is anchored at its back-left corner, so this tucks it into the
    // back-left corner of the room
    position: {
        x: wallFaces.left,
        y: feetFromFloor(0),
        z: wallFaces.back,
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
// Monitor is positioned relative to the desk's back-left corner
const defaultMonitorTraits: DeepPartial<ObjectTraits> = {
    scale: MONITOR_SCALE,
    position: {
        x: scaledFeet(2),
        y: scaledHeight(3.2),
        z: scaledFeet(1.4),
    },
    rotation: {
        y: -1,
    },
    boxSize: {
        x: 10,
        y: 6,
        z: 6,
    },
    boxAnchor: {
        x: 0,
        y: 0,
        z: 0,
    },
    approachYawOffset: Math.PI / 4,
};

// Screen overlay in the monitor model's own units (the model is normalized to
// 1 unit tall). The CRT faces the model's local +X and its glass tilts back
// slightly, measured from monitor.glb.
const defaultMonitorScreenTraits: DeepPartial<ObjectTraits & GlowTraits> = {
    width: 0.6,
    height: 0.5,
    position: {
        x: 0.39,
        y: 0.105,
        z: 0,
    },
    rotation: {
        x: -0.1,
        y: Math.PI / 2,
    },
    color: "#00ff00",
    intensity: 1.6,
};

// Only HDR colors (LEDs, screens) should exceed the threshold, so regular lit
// surfaces never bloom
const defaultEffectsSettings: EffectsSettings = {
    bloomIntensity: 1.2,
    bloomThreshold: 0.65,
    bloomSmoothing: 0.3,
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
    characterBoundary: number;
    cameraBuffer: number;
    characterSpeed: number;
    characterHeight: number;
    cameraOffset: {
        x: number;
        y: number;
        z: number;
    };
    zoomSettings: {
        min: number;
        max: number;
        speed: number;
        default: number;
    };
    desk: DeepPartial<ObjectTraits>;
    monitor: DeepPartial<ObjectTraits>;
    monitorScreen: DeepPartial<ObjectTraits & GlowTraits>;
    effects: EffectsSettings;
    bass: DeepPartial<ObjectTraits>;
    deck: DeepPartial<ObjectTraits>;
}

// Default scene configuration
const defaultSceneConfig: SceneConfig = {
    rotations: rotationY,
    roomSize: ROOM_SIZE,
    wallColor: "#F5F5DC",
    wallHeight: ROOM_HEIGHT,
    wallThickness: WALL_THICKNESS,
    characterHeight: scaledHeight(6),
    characterBoundary: ROOM_SIZE - 2.25,
    cameraBuffer: 2,
    characterSpeed: 0.1,
    cameraOffset: {
        x: 0,
        y: 8,
        z: 18,
    },
    zoomSettings: {
        min: 0.5,
        max: 2,
        speed: 0.1,
        default: 1,
    },
    desk: defaultDeskTraits,
    monitor: defaultMonitorTraits,
    monitorScreen: defaultMonitorScreenTraits,
    effects: defaultEffectsSettings,
    bass: defaultBassTraits,
    deck: defaultDeckTraits,
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
