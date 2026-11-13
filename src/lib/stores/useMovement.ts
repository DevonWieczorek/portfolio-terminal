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
    // Direction the character is walking (radians around Y), null when standing still.
    heading: number | null;
    setPosition: (position: Position) => void;
    setCameraYaw: (cameraYaw: number) => void;
    setHeading: (heading: number | null) => void;
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
    heading: null,

    setPosition: position =>
        set(state =>
            hasPositionChanged(state.position, position) ? { position } : state
        ),

    setCameraYaw: cameraYaw => set({ cameraYaw }),

    // Called every physics step, so skip publishing unchanged values.
    setHeading: heading =>
        set(state => (state.heading === heading ? state : { heading })),
}));
