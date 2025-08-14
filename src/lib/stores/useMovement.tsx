import create from "zustand";

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
  z: 0
};

export const useMovement = create<MovementState>((set) => ({
  position: initialPosition,

  setPosition: (position) => set({ position }),

  resetPosition: () => set({ position: initialPosition })
}));
