import { Color, SRGBColorSpace } from "three";

const clampChannel = (value: number) => Math.min(255, Math.max(0, value));

// Approximates the color of a black-body light source at the given
// temperature (Tanner Helland's curve fit, valid for ~1000K-40000K)
export function kelvinToColor(kelvin: number): Color {
    const t = kelvin / 100;

    const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
    const g =
        t <= 66
            ? 99.4708025861 * Math.log(t) - 161.1195681661
            : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    const b =
        t >= 66
            ? 255
            : t <= 19
              ? 0
              : 138.5177312231 * Math.log(t - 10) - 305.0447927307;

    return new Color().setRGB(
        clampChannel(r) / 255,
        clampChannel(g) / 255,
        clampChannel(b) / 255,
        SRGBColorSpace
    );
}
