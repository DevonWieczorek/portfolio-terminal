import { Vector3 } from "three";
import { getLocalHour, getSunDirection, getWindowSunlight } from "./sun";

const PATH = { sunrise: 6, sunset: 18, maxElevation: Math.PI / 3 };
const sunAt = (hour: number) => getSunDirection(hour, PATH, new Vector3());

describe("getSunDirection", () => {
    it("rises in the east and sets in the west", () => {
        const sunrise = sunAt(6);
        const sunset = sunAt(18);

        expect(sunrise.x).toBeCloseTo(1);
        expect(sunrise.y).toBeCloseTo(0);
        expect(sunset.x).toBeCloseTo(-1);
        expect(sunset.y).toBeCloseTo(0);
    });

    it("peaks in the south at midday", () => {
        const noon = sunAt(12);

        expect(noon.x).toBeCloseTo(0);
        expect(noon.y).toBeCloseTo(Math.sin(Math.PI / 3));
        expect(noon.z).toBeGreaterThan(0);
    });

    it("is below the horizon and in the north at midnight", () => {
        const midnight = sunAt(0);

        expect(midnight.y).toBeLessThan(0);
        expect(midnight.z).toBeLessThan(0);
        expect(sunAt(24).y).toBeCloseTo(midnight.y);
    });

    it("returns a unit vector", () => {
        [0, 3, 7.5, 12, 16.25, 21].forEach(hour => {
            expect(sunAt(hour).length()).toBeCloseTo(1);
        });
    });
});

describe("getWindowSunlight", () => {
    it("is full at midday and zero at night", () => {
        expect(getWindowSunlight(sunAt(12))).toBeCloseTo(1);
        expect(getWindowSunlight(sunAt(0))).toBe(0);
    });

    it("is zero when the sun is due east or west", () => {
        expect(getWindowSunlight(sunAt(6.01))).toBe(0);
        expect(getWindowSunlight(sunAt(17.99))).toBe(0);
    });
});

describe("getLocalHour", () => {
    it("includes minutes and seconds as a fraction", () => {
        expect(getLocalHour(new Date(2026, 0, 1, 14, 30, 36))).toBeCloseTo(
            14.51
        );
    });
});
