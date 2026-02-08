import { create } from "zustand";

interface Position {
    x: number;
    y: number;
    z: number;
}

interface MovementState {
    position: Position;
    setPosition: (position: Position) => void;
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

    setPosition: position =>
        set(state =>
            hasPositionChanged(state.position, position) ? { position } : state
        ),

    resetPosition: () => set({ position: initialPosition }),
}));
