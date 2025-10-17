import create from "zustand";

const BLACKOUT_DURATION = 400;

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
        isBlackout: boolean;
        enterTerminal: (target: CameraTarget) => void;
        exitTerminal: () => void;
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
