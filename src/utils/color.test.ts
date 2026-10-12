import { SRGBColorSpace } from "three";
import { kelvinToColor } from "./color";

describe("kelvinToColor", () => {
    const toRGB = (kelvin: number) => {
        const rgb = { r: 0, g: 0, b: 0 };
        kelvinToColor(kelvin).getRGB(rgb, SRGBColorSpace);
        return rgb;
    };

    it("makes warm temperatures red-heavy", () => {
        const { r, g, b } = toRGB(2700);

        expect(r).toBeCloseTo(1);
        expect(g).toBeLessThan(r);
        expect(b).toBeLessThan(g);
    });

    it("approaches neutral white around daylight", () => {
        const { r, g, b } = toRGB(6500);

        expect(r).toBeCloseTo(1, 1);
        expect(g).toBeCloseTo(1, 1);
        expect(b).toBeCloseTo(1, 1);
    });
});
