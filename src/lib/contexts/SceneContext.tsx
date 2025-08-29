import React, { createContext, useContext, ReactNode } from 'react';

interface ObjectTraits {
  width: number;
  height: number;
  thickness: number;
  scale: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
};

const ROOM_SIZE: number = 30;

const defaultDeskTraits: DeepPartial<ObjectTraits> = {
  height: 1.2,
  thickness: 0.15,
  scale: 2,
  // scale: 1.5,
  position: {
    // x: -ROOM_SIZE / 2 + 0.1,
    x: -12,
    y: 0,
    // z: -ROOM_SIZE / 2 + 0.1,
    z: -18,
  }
};

const defaultMonitorTraits: DeepPartial<ObjectTraits> = {
  // position: {
  //   x: defaultDeskTraits.position.x + 3,
  //   y: defaultDeskTraits.height + defaultDeskTraits.thickness + 0.15,
  //   z: defaultDeskTraits.position.z + 0.3
  // },
  position: {
    x: defaultDeskTraits.position.x - 1,
    y: 2.25,
    z: -13
  },
  rotation: {
    y: -1,
  }
};

const defaultBassTraits: DeepPartial<ObjectTraits> = {
  position: {
    x: -1,
    y: 4,
    z: -14
  },
  scale: 5,
};

// Scene configuration interface
interface SceneConfig {
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
};

// Default scene configuration
const defaultSceneConfig: SceneConfig = {
  roomSize: ROOM_SIZE,
  wallColor: '#F5F5DC',
  wallHeight: 12,
  wallThickness: 1,
  characterScale: 1.5,
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
  bass: defaultBassTraits
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