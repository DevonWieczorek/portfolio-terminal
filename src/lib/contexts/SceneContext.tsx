import React, { createContext, useContext, ReactNode } from 'react';

interface Coordinates {
  x: number;
  y: number;
  z: number;
};

interface ObjectTraits {
  width: number;
  height: number;
  thickness: number;
  scale: number;
  spacing: number;
  color: string;
  position: Coordinates;
  rotation: Coordinates;
};

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
  interiorWidth: ROOM_WIDTH - (WALL_THICKNESS * 2),
  interiorDepth: ROOM_DEPTH - (WALL_THICKNESS * 2),
};

const rotationY: Rotations = {
  clockwise: -Math.PI / 2,
  counterclockwise: Math.PI / 2,
};

// Scale factor based on INTERIOR room size vs standard interior (28x28x12)
const STANDARD_INTERIOR = 28; // 30 - (1 * 2) = 28 feet interior
const scaleFactorXZ = Math.min(roomDimensions.interiorWidth, roomDimensions.interiorDepth) / STANDARD_INTERIOR;
const scaleFactorY = ROOM_HEIGHT / 12;

// Conversion functions that auto-scale with room size
const scaledFeet = (feetValue: number) => feetValue * scaleFactorXZ;
const scaledHeight = (feetValue: number) => feetValue * scaleFactorY;

// Position helpers that work with interior space
const feetFromCenter = (feetValue: number) => feetValue;
const feetFromFloor = (feetValue: number) => feetValue;

const feetFromWall = {
  left: (feetValue: number) => -roomDimensions.interiorWidth / 2 + feetValue,
  right: (feetValue: number) => roomDimensions.interiorWidth / 2 - feetValue,
  back: (feetValue: number) => -roomDimensions.interiorDepth / 2 + feetValue,
  front: (feetValue: number) => roomDimensions.interiorDepth / 2 - feetValue,
};

// Optional: Helpers for wall positioning
const wallPositions = {
  left: -ROOM_WIDTH / 2 + WALL_THICKNESS / 2,
  right: ROOM_WIDTH / 2 - WALL_THICKNESS / 2,
  back: -ROOM_DEPTH / 2 + WALL_THICKNESS / 2,
  front: ROOM_DEPTH / 2 - WALL_THICKNESS / 2,
  floor: -WALL_THICKNESS / 2,
  ceiling: ROOM_HEIGHT + WALL_THICKNESS / 2,
};

const defaultDeskTraits: DeepPartial<ObjectTraits> = {
  height: scaledFeet(4),
  thickness: scaledFeet(0.5),
  scale: scaledFeet(2),
  position: {
    x: feetFromWall.left(2),
    y: feetFromFloor(0),
    z: feetFromWall.back(-4), // Pivot point in desk model isn't top left corener
  }
};

// Monitor is Scaled/Positioned relative to the desk
const defaultMonitorTraits: DeepPartial<ObjectTraits> = {
  position: {
    x: scaledFeet(-0.5),
    y: scaledFeet(1.5),
    z: scaledFeet(2.6),
  },
  rotation: {
    y: -1,
  }
};

const defaultBassTraits: DeepPartial<ObjectTraits> = {
  position: {
    x: feetFromCenter(-1 * scaleFactorXZ),      // Scales with room
    y: scaledHeight(6),                         // Scales with ceiling height
    z: feetFromWall.back(1 * scaleFactorXZ),    // Scales with room depth
  },
  scale: scaledFeet(3.5),
  spacing: scaledFeet(3),                    // Bass size scales with room
};

// const NUM_DECKS: number = 4;
const DECK_SCALE: number = scaledFeet(3);
const defaultDeckTraits: DeepPartial<ObjectTraits> = {
  position: {
    x: feetFromCenter(-1 * scaleFactorXZ),
    y: scaledHeight(((ROOM_HEIGHT - DECK_SCALE) / 2)),
    z: feetFromWall.right(0) * -1,
  },
  scale: DECK_SCALE,
  spacing: scaledFeet(2),
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
  characterScale: number;
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
  bass: DeepPartial<ObjectTraits>;
  deck: DeepPartial<ObjectTraits>;
};

// Default scene configuration
const defaultSceneConfig: SceneConfig = {
  rotations: rotationY,
  roomSize: ROOM_SIZE,
  wallColor: '#F5F5DC',
  wallHeight: ROOM_HEIGHT,
  wallThickness: WALL_THICKNESS,
  characterScale: 1.75,
  characterBoundary: ROOM_SIZE - 2.25,
  cameraBuffer: 2,
  characterSpeed: 0.1,
  cameraOffset: {
    x: 0,
    y: 8,
    z: 18
  },
  zoomSettings: {
    min: 0.5,
    max: 2,
    speed: 0.1,
    default: 1
  },
  desk: defaultDeskTraits,
  monitor: defaultMonitorTraits,
  bass: defaultBassTraits,
  deck: defaultDeckTraits
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
    throw new Error('useScene must be used within a SceneProvider');
  }
  return context;
}