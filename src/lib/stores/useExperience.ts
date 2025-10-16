import { create } from "zustand";

export type ExperienceMode = "scene" | "terminal";

interface MonitorTransform {
        position: [number, number, number];
        direction: [number, number, number];
        up: [number, number, number];
        size: [number, number, number];
}

interface ExperienceState {
        experience: ExperienceMode;
        target: ExperienceMode;
        monitorTransform: MonitorTransform | null;
        requestExperience: (target: ExperienceMode) => void;
        setExperience: (experience: ExperienceMode) => void;
        setMonitorTransform: (transform: MonitorTransform) => void;
}

const arraysEqual = (a: readonly number[], b: readonly number[], tolerance = 1e-4) => {
        if (a.length !== b.length) {
                return false;
        }

        for (let i = 0; i < a.length; i += 1) {
                if (Math.abs(a[i] - b[i]) > tolerance) {
                        return false;
                }
        }

        return true;
};

export const useExperience = create<ExperienceState>()((set) => ({
        experience: "scene",
        target: "scene",
        monitorTransform: null,
        requestExperience: (target) =>
                set((state) => {
                        if (state.target === target) {
                                return state;
                        }

                        return { target };
                }),
        setExperience: (experience) =>
                set((state) => {
                        if (state.experience === experience && state.target === experience) {
                                return state;
                        }

                        return { experience, target: experience };
                }),
        setMonitorTransform: (transform) =>
                set((state) => {
                        const previous = state.monitorTransform;

                        if (
                                previous &&
                                arraysEqual(previous.position, transform.position) &&
                                arraysEqual(previous.direction, transform.direction) &&
                                arraysEqual(previous.up, transform.up) &&
                                arraysEqual(previous.size, transform.size)
                        ) {
                                return state;
                        }

                        return { monitorTransform: transform };
                }),
}));
