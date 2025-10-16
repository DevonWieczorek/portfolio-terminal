import create from "zustand";

export type ExperienceMode = "scene" | "terminal";

export type VectorTuple = [number, number, number];

export interface CameraTarget {
        position: VectorTuple;
        lookAt: VectorTuple;
}

interface ExperienceState {
        mode: ExperienceMode;
        targetMode: ExperienceMode;
        isTransitioning: boolean;
        cameraOverride: CameraTarget | null;
        enterTerminal: (target: CameraTarget) => void;
        exitTerminal: () => void;
        completeTransition: () => void;
}

export const useExperience = create<ExperienceState>(set => ({
        mode: "scene",
        targetMode: "scene",
        isTransitioning: false,
        cameraOverride: null,
        enterTerminal: target =>
                set(state => {
                        if (state.mode === "terminal" || state.isTransitioning) {
                                return state;
                        }

                        return {
                                targetMode: "terminal",
                                isTransitioning: true,
                                cameraOverride: target,
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
                        };
                }),
        completeTransition: () =>
                set(state => ({
                        mode: state.targetMode,
                        isTransitioning: false,
                        cameraOverride: state.targetMode === "scene" ? null : state.cameraOverride,
                })),
}));
