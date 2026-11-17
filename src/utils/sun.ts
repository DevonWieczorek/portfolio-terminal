import { MathUtils, type Vector3 } from "three";

export interface SunPath {
    sunrise: number; // local hour (0-24)
    sunset: number;
    maxElevation: number; // radians above the horizon at midday
}

// How far below the horizon the sun sinks at midnight
const NIGHT_DEPTH = Math.PI / 4;

export const getLocalHour = (date: Date) =>
    date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

// Points `target` from the room toward the sun at `hour`. A stylized arc,
// not real astronomy: the sun rises in the east (+X), crosses the south (+Z,
// where the window looks out) at midday and sets in the west (-X), then
// circles under the north overnight.
export function getSunDirection(
    hour: number,
    { sunrise, sunset, maxElevation }: SunPath,
    target: Vector3
): Vector3 {
    const time = ((hour % 24) + 24) % 24;
    let azimuth: number, elevation: number;

    if (time >= sunrise && time <= sunset) {
        const progress = (time - sunrise) / (sunset - sunrise);
        azimuth = Math.PI * progress;
        elevation = maxElevation * Math.sin(Math.PI * progress);
    } else {
        const nightLength = 24 - (sunset - sunrise);
        const progress = ((((time - sunset) % 24) + 24) % 24) / nightLength;
        azimuth = Math.PI * (1 + progress);
        elevation = -NIGHT_DEPTH * Math.sin(Math.PI * progress);
    }

    const horizontal = Math.cos(elevation);
    return target.set(
        horizontal * Math.cos(azimuth),
        Math.sin(elevation),
        horizontal * Math.sin(azimuth)
    );
}

// How much sun reaches through a south-facing window, from 0 to 1: none
// while it's below the horizon, and fading out as it swings round to the
// east or west, where the wall would block its rays
export function getWindowSunlight(sunDirection: Vector3): number {
    const aboveHorizon = MathUtils.smoothstep(sunDirection.y, 0, 0.12);
    const horizontal = Math.hypot(sunDirection.x, sunDirection.z);
    const facing = horizontal > 0 ? sunDirection.z / horizontal : 0;
    return aboveHorizon * MathUtils.smoothstep(facing, 0.15, 0.45);
}
