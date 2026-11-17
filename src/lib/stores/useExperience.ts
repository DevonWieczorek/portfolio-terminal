import { create } from "zustand";

const BLACKOUT_DURATION = 400;

// "inspect" holds the camera on an object up close, with no terminal
export type ExperienceMode = "scene" | "terminal" | "inspect";

export type VectorTuple = Coordinate;

export interface CameraTarget {
    position: VectorTuple;
    lookAt: VectorTuple;
}

interface ExperienceState {
    mode: ExperienceMode;
    targetMode: ExperienceMode;
    isTransitioning: boolean;
    cameraOverride: CameraTarget | null;
    isBlackout: boolean;
    enterTerminal: (target: CameraTarget) => void;
    exitTerminal: () => void;
    enterInspect: (target: CameraTarget) => void;
    exitInspect: () => void;
    startBlackout: () => void;
    completeTransition: () => void;
}

export const useExperience = create<ExperienceState>((set, get) => {
    const finalizeTransition = () => {
        const { targetMode, cameraOverride } = get();

        set({
            mode: targetMode,
            isTransitioning: false,
            cameraOverride: targetMode === "scene" ? null : cameraOverride,
            isBlackout: false,
        });
    };

    return {
        mode: "scene",
        targetMode: "scene",
        isTransitioning: false,
        cameraOverride: null,
        isBlackout: false,
        enterTerminal: target =>
            set(state => {
                if (state.mode === "terminal" || state.isTransitioning) {
                    return state;
                }

                return {
                    targetMode: "terminal",
                    isTransitioning: true,
                    cameraOverride: target,
                    isBlackout: false,
                };
            }),
        exitTerminal: () =>
            set(state => {
                if (state.mode !== "terminal" || state.isTransitioning) {
                    return state;
                }

                return {
                    targetMode: "scene",
                    isTransitioning: true,
                    cameraOverride: state.cameraOverride,
                    isBlackout: false,
                };
            }),
        enterInspect: target =>
            set(state => {
                if (state.mode !== "scene" || state.isTransitioning) {
                    return state;
                }

                return {
                    targetMode: "inspect",
                    isTransitioning: true,
                    cameraOverride: target,
                };
            }),
        exitInspect: () =>
            set(state => {
                if (state.mode !== "inspect" || state.isTransitioning) {
                    return state;
                }

                // Hands control straight back so the avatar can move while
                // the camera glides back behind it on its usual follow
                return {
                    mode: "scene",
                    targetMode: "scene",
                    isTransitioning: false,
                    cameraOverride: null,
                };
            }),
        startBlackout: () => {
            const { isTransitioning, targetMode, isBlackout } = get();

            if (!isTransitioning || targetMode !== "terminal" || isBlackout) {
                return;
            }

            set({ isBlackout: true });

            setTimeout(finalizeTransition, BLACKOUT_DURATION);
        },
        completeTransition: finalizeTransition,
    };
});
