import { create } from "zustand";

interface Position {
    x: number;
    y: number;
    z: number;
}

interface MovementState {
    position: Position;
    // Camera orbit angle (radians around Y) so movement can be camera-relative.
    cameraYaw: number;
    setPosition: (position: Position) => void;
    setCameraYaw: (cameraYaw: number) => void;
    resetPosition: () => void;
}

const initialPosition: Position = {
    x: 0,
    y: 1,
    z: 0,
};

// Zustand uses referential equality; avoid publishing identical position state.
const hasPositionChanged = (current: Position, next: Position) =>
    current.x !== next.x || current.y !== next.y || current.z !== next.z;

export const useMovement = create<MovementState>(set => ({
    position: initialPosition,
    cameraYaw: 0,

    setPosition: position =>
        set(state =>
            hasPositionChanged(state.position, position) ? { position } : state
        ),

    setCameraYaw: cameraYaw => set({ cameraYaw }),

    resetPosition: () => set({ position: initialPosition }),
}));
