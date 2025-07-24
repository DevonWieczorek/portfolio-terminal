import React, { createContext, useContext, ReactNode } from 'react';

// Scene configuration interface
interface SceneConfig {
  roomSize: number;
  wallHeight: number;
  wallThickness: number;
  characterBoundary: number;
  cameraBuffer: number;
  characterSpeed: number;
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
}

// Default scene configuration
const defaultSceneConfig: SceneConfig = {
  roomSize: 30, // Increased from 20 to 30 (1.5x)
  wallHeight: 12, // Increased from 8 to 12 (1.5x)
  wallThickness: 1,
  characterBoundary: 27.75, // roomSize - 2.25 (proportionally adjusted)
  cameraBuffer: 2,
  characterSpeed: 0.1,
  cameraOffset: {
    x: 0,
    y: 8,
    z: 18 // Increased proportionally from 12 to 18
  },
  zoomSettings: {
    min: 0.5,
    max: 2,
    speed: 0.1,
    default: 1
  }
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