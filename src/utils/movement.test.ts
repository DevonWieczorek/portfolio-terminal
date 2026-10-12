import { getFacingRotation, toCameraRelative } from "./movement";

describe("toCameraRelative", () => {
    it("leaves input unchanged with the default camera", () => {
        const move = toCameraRelative(0, -1, 0);
        expect(move.x).toBeCloseTo(0);
        expect(move.z).toBeCloseTo(-1);
    });

    it("flips controls when the camera is turned around", () => {
        const forward = toCameraRelative(0, -1, Math.PI);
        expect(forward.x).toBeCloseTo(0);
        expect(forward.z).toBeCloseTo(1);

        const right = toCameraRelative(1, 0, Math.PI);
        expect(right.x).toBeCloseTo(-1);
        expect(right.z).toBeCloseTo(0);
    });

    it("moves forward toward -x after turning the camera left 90 degrees", () => {
        const move = toCameraRelative(0, -1, Math.PI / 2);
        expect(move.x).toBeCloseTo(-1);
        expect(move.z).toBeCloseTo(0);
    });
});

describe("getFacingRotation", () => {
    it("matches the character's original facing angles", () => {
        expect(getFacingRotation({ x: 0, z: -1 })).toBeCloseTo(0);
        expect(getFacingRotation({ x: -1, z: 0 })).toBeCloseTo(Math.PI / 2);
        expect(getFacingRotation({ x: 1, z: 0 })).toBeCloseTo(-Math.PI / 2);
        expect(Math.abs(getFacingRotation({ x: 0, z: 1 }))).toBeCloseTo(
            Math.PI
        );
    });
});
