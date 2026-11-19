import { createFootstepBuffer } from "./footstep";

const createContext = () => {
    const sampleRate = 44100;
    return {
        sampleRate,
        createBuffer: jest.fn(
            (_: number, length: number) =>
                ({
                    length,
                    getChannelData: () => data,
                }) as unknown as AudioBuffer
        ),
    };
};
let data: Float32Array;

describe("createFootstepBuffer", () => {
    beforeEach(() => {
        data = new Float32Array(Math.floor(0.12 * 44100));
    });

    it("makes a short mono buffer", () => {
        const context = createContext();
        createFootstepBuffer(context);

        expect(context.createBuffer).toHaveBeenCalledWith(
            1,
            data.length,
            44100
        );
    });

    it("stays within full scale and fades out", () => {
        createFootstepBuffer(createContext());

        const peak = (from: number, to: number) =>
            data
                .subarray(from, to)
                .reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);
        const tenth = Math.floor(data.length / 10);

        expect(peak(0, data.length)).toBeLessThanOrEqual(1);
        expect(peak(0, tenth)).toBeGreaterThan(0.3);
        expect(peak(data.length - tenth, data.length)).toBeLessThan(0.05);
    });
});
