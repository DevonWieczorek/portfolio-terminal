import { memo, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, Color, Vector3 } from "three";

interface SkyProps {
    // Unit vector toward the sun; the moon sits opposite it
    sunDirection: Vector3;
}

// Big enough to wrap the whole room, so it's only ever seen through the window
const SKY_RADIUS = 60;
// Keeps the daytime sky just under the bloom threshold, so only the sun and
// moon glow
const SKY_EXPOSURE = 0.85;
const SUN_GLOW = 4;
const MOON_GLOW = 1.5;
const CLOUD_DRIFT = 0.004;
// The camera looks down into the room, so through the window it mostly sees
// below eye level. Dropping the horizon keeps the window full of sky, with
// the hills along the bottom.
const HORIZON_DIP = 0.22;

const PALETTE = {
    uDayZenith: "#5aa9e6",
    uDayHorizon: "#bfe3f2",
    uDuskHorizon: "#ffb38a",
    uNightZenith: "#141a33",
    uNightHorizon: "#2b3358",
    uSunColor: "#fff4d6",
    uMoonColor: "#f3efe3",
    uCloudDay: "#fbfaf6",
    uCloudNight: "#3a4266",
    uHillFar: "#8fbf88",
    uHillNear: "#5f9e63",
};

const SKY_VERTEX = /* glsl */ `
    varying vec3 vWorldPosition;
    void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
`;

const SKY_FRAGMENT = /* glsl */ `
    uniform vec3 uSunDirection;
    uniform float uTime;
    uniform float uExposure;
    uniform float uSunGlow;
    uniform float uMoonGlow;
    uniform float uCloudDrift;
    uniform float uHorizonDip;
    uniform vec3 uDayZenith;
    uniform vec3 uDayHorizon;
    uniform vec3 uDuskHorizon;
    uniform vec3 uNightZenith;
    uniform vec3 uNightHorizon;
    uniform vec3 uSunColor;
    uniform vec3 uMoonColor;
    uniform vec3 uCloudDay;
    uniform vec3 uCloudNight;
    uniform vec3 uHillFar;
    uniform vec3 uHillNear;
    varying vec3 vWorldPosition;

    float hash(vec3 p) {
        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash(vec3(i, 0.0));
        float b = hash(vec3(i + vec2(1.0, 0.0), 0.0));
        float c = hash(vec3(i + vec2(0.0, 1.0), 0.0));
        float d = hash(vec3(i + vec2(1.0, 1.0), 0.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    // Sharp-edged disc of angular radius acos(cosRadius), softened by a glow
    float disc(vec3 dir, vec3 center, float cosRadius) {
        float d = dot(dir, center);
        return smoothstep(cosRadius - 0.0004, cosRadius, d)
            + pow(max(d, 0.0), 200.0) * 0.25;
    }

    void main() {
        // From the camera, not the dome's center, so the sky reads as
        // infinitely far away from anywhere in the room
        vec3 dir = normalize(vWorldPosition - cameraPosition);
        float elevation = dir.y + uHorizonDip;
        float azimuth = atan(dir.x, dir.z);
        float sunHeight = uSunDirection.y;

        float day = smoothstep(-0.12, 0.2, sunHeight);
        float night = 1.0 - day;
        float twilight = exp(-pow(sunHeight / 0.15, 2.0));
        vec2 sunFlat = normalize(uSunDirection.xz + vec2(1e-5));
        float sunSide = 0.5 + 0.5 * dot(normalize(dir.xz + vec2(1e-5)), sunFlat);

        vec3 zenith = mix(uNightZenith, uDayZenith, day);
        vec3 horizon = mix(uNightHorizon, uDayHorizon, day);
        horizon = mix(horizon, uDuskHorizon, twilight * (0.35 + 0.65 * sunSide));
        vec3 color = mix(horizon, zenith, sqrt(clamp(elevation, 0.0, 1.0)));

        // Round stars on a grid of cells, twinkling out of step
        vec3 cell = floor(dir * 120.0);
        float starSeed = hash(cell);
        float starShape = smoothstep(0.35, 0.1, length(fract(dir * 120.0) - 0.5));
        float twinkle = 0.6 + 0.4 * sin(uTime * 2.0 + starSeed * 100.0);
        color += step(0.975, starSeed) * starShape * twinkle * night
            * smoothstep(0.03, 0.15, elevation);

        color += uSunColor * uSunGlow * disc(dir, uSunDirection, 0.9989)
            * smoothstep(-0.2, -0.1, sunHeight);
        // Opposite the sun but on a flatter arc, so it rides low enough to
        // pass through the window instead of staying overhead all night
        vec3 moonDirection = normalize(-uSunDirection * vec3(1.0, 0.2, 1.0));
        color += uMoonColor * uMoonGlow * disc(dir, moonDirection, 0.9993)
            * smoothstep(0.0, 0.1, -sunHeight);

        // Puffy cartoon clouds in a band above the horizon
        vec2 cloudUv = vec2(azimuth * 7.0 + uTime * uCloudDrift, elevation * 16.0);
        float cloudNoise = noise(cloudUv) * 0.6 + noise(cloudUv * 2.0) * 0.3
            + noise(cloudUv * 4.0) * 0.1;
        float cloud = smoothstep(0.5, 0.54, cloudNoise)
            * smoothstep(0.04, 0.12, elevation)
            * (1.0 - smoothstep(0.35, 0.55, elevation));
        vec3 cloudColor = mix(uCloudNight, uCloudDay, day);
        cloudColor = mix(cloudColor, uDuskHorizon, twilight * 0.5);
        color = mix(color, cloudColor, cloud);

        // Two layers of rolling hills, shaded down at night
        float aa = fwidth(elevation);
        float farHill = 0.07 + 0.025 * sin(azimuth * 5.0 + 1.3)
            + 0.015 * sin(azimuth * 11.0 + 0.4);
        float nearHill = 0.035 + 0.03 * sin(azimuth * 3.0 + 2.1)
            + 0.01 * sin(azimuth * 13.0);
        float hillLight = mix(0.12, 1.0, day);
        vec3 hillTint = mix(vec3(1.0), uDuskHorizon, twilight * 0.3) * hillLight;
        color = mix(color, uHillFar * hillTint,
            smoothstep(farHill + aa, farHill - aa, elevation));
        color = mix(color, uHillNear * hillTint,
            smoothstep(nearHill + aa, nearHill - aa, elevation));

        gl_FragColor = vec4(color * uExposure, 1.0);
    }
`;

// Stylized sky seen through the window: a day/night gradient with a sun,
// moon, stars, drifting clouds and hills. Unlit, since it's a light source.
const Sky = memo(function Sky({ sunDirection }: SkyProps) {
    const uniforms = useMemo(
        () => ({
            uSunDirection: { value: new Vector3() },
            uTime: { value: 0 },
            uExposure: { value: SKY_EXPOSURE },
            uSunGlow: { value: SUN_GLOW },
            uMoonGlow: { value: MOON_GLOW },
            uCloudDrift: { value: CLOUD_DRIFT },
            uHorizonDip: { value: HORIZON_DIP },
            // Color converts the sRGB hex values to linear for the shader
            ...Object.fromEntries(
                Object.entries(PALETTE).map(([name, hex]) => [
                    name,
                    { value: new Color(hex) },
                ])
            ),
        }),
        []
    );

    useEffect(() => {
        uniforms.uSunDirection.value.copy(sunDirection);
    }, [sunDirection, uniforms]);

    useFrame((_, delta) => {
        uniforms.uTime.value += delta;
    });

    return (
        <mesh>
            <sphereGeometry args={[SKY_RADIUS, 32, 16]} />
            <shaderMaterial
                side={BackSide}
                uniforms={uniforms}
                vertexShader={SKY_VERTEX}
                fragmentShader={SKY_FRAGMENT}
            />
        </mesh>
    );
});
Sky.displayName = "Sky";

export default Sky;
