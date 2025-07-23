"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface RoomDimensions {
    size: number;
    height: number;
    wallThickness: number;
}

export interface MovementSettings {
    speed: number;
    boundary: number; // half size
}

export interface CameraConfig {
    offset: [number, number, number];
    zoom: { min: number; max: number };
}

export interface SceneConfig {
    room: RoomDimensions;
    movement: MovementSettings;
    camera: CameraConfig;
}

const defaultConfig: SceneConfig = {
    room: { size: 1000, height: 1000, wallThickness: 10 },
    movement: { speed: 5, boundary: 480 },
    camera: { offset: [0, 80, 200], zoom: { min: 40, max: 400 } },
};

const SceneContext = createContext<SceneConfig>(defaultConfig);

export const SceneProvider = ({ children }: { children: ReactNode }) => (
    <SceneContext.Provider value={defaultConfig}>{children}</SceneContext.Provider>
);

export const useScene = () => useContext(SceneContext);

export default SceneContext;
