import { create } from "zustand";
import { AudioContext as ThreeAudioContext, AudioListener } from "three";

interface AudioState {
    // The room's ears, riding on the camera. Null until the visitor's first
    // key press or click, since browsers won't start audio before one.
    listener: AudioListener | null;
    unlock: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
    listener: null,

    // Must run while a user gesture is being handled. Three creates its
    // shared context lazily, so this creates and resumes it.
    unlock: () => {
        if (typeof window === "undefined" || !("AudioContext" in window)) {
            return;
        }
        void ThreeAudioContext.getContext().resume();
        if (!get().listener) {
            set({ listener: new AudioListener() });
        }
    },
}));
