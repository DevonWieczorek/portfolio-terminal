import { create } from "zustand";

interface Point {
    x: number;
    y: number;
    z: number;
}

interface ReachState {
    // World-space point the character last reached for
    target: Point | null;
    // Bumped on every request, so reaching for the same spot twice still
    // starts a new reach
    requestId: number;
    reachFor: (target: Point) => void;
}

// Lets scene objects ask the character to reach out to them, e.g. the
// turntable when the visitor drops the needle
export const useReach = create<ReachState>(set => ({
    target: null,
    requestId: 0,
    reachFor: target =>
        set(state => ({ target, requestId: state.requestId + 1 })),
}));
