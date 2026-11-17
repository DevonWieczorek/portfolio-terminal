import { create } from "zustand";

interface MusicState {
    // Beats per minute of the track that's playing, null when it's silent
    tempo: number | null;
    // Seconds into the track, so beat-synced motion stays in step across
    // pauses and loops
    trackTime: number;
    setTempo: (tempo: number | null) => void;
    setTrackTime: (trackTime: number) => void;
}

export const useMusic = create<MusicState>(set => ({
    tempo: null,
    trackTime: 0,

    setTempo: tempo =>
        set(state => (state.tempo === tempo ? state : { tempo })),

    // Called every frame while the music plays
    setTrackTime: trackTime => set({ trackTime }),
}));
