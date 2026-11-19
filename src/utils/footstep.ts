type BufferFactory = Pick<BaseAudioContext, "createBuffer" | "sampleRate">;

const DURATION = 0.12;
// A soft, low "tock": a sine thump that drops in pitch, plus a muffled scuff
const START_PITCH = 190;
const END_PITCH = 80;
const PITCH_DROP_TIME = 0.04;
const DECAY_TIME = 0.028;
const SCUFF_LEVEL = 0.35;
// One-pole low-pass on the scuff noise; closer to 1 is more muffled
const SCUFF_SMOOTHING = 0.85;

// Synthesizes one cartoon footstep, so it needs no audio file. Generated once
// and replayed with a little random detune for each step.
export function createFootstepBuffer(context: BufferFactory): AudioBuffer {
    const { sampleRate } = context;
    const length = Math.floor(DURATION * sampleRate);
    const buffer = context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    let phase = 0;
    let scuff = 0;
    for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const pitch =
            END_PITCH +
            (START_PITCH - END_PITCH) * Math.exp(-t / PITCH_DROP_TIME);
        phase += (2 * Math.PI * pitch) / sampleRate;
        scuff =
            scuff * SCUFF_SMOOTHING +
            (Math.random() * 2 - 1) * (1 - SCUFF_SMOOTHING);
        const envelope = Math.exp(-t / DECAY_TIME);
        const sample = (Math.sin(phase) + scuff * SCUFF_LEVEL * 4) * 0.7;
        data[i] = Math.max(-1, Math.min(1, sample)) * envelope;
    }

    return buffer;
}
