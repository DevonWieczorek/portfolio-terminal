import { memo, useMemo } from "react";
import { Color } from "three";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";
import { kelvinToColor } from "@/utils/color";

type LightingControls = {
    brightness: number;
    temperature: number;
};

// Base intensities at brightness 1, balanced so the room center reads well lit
// and light falls off toward the walls and corners
const AMBIENT_INTENSITY = 0.6;
const KEY_INTENSITY = 0.8;
const FIXTURE_INTENSITY = 30;
// Light bounced back up off the wood floor
const FLOOR_BOUNCE_COLOR = "#3d3833";
// Renders have no camera white balance, so a pure black-body color tints the
// whole room; blending toward white keeps the warmth subtle
const WARMTH_STRENGTH = 0.5;
const WHITE = new Color("#ffffff");

const Lights = memo(() => {
    const { lighting, wallHeight } = useScene();

    let brightness: number, temperature: number;

    // #if DEBUG
    ({ brightness, temperature } = useControls(
        "Lighting",
        {
            brightness: {
                value: lighting.brightness,
                min: 0,
                max: 3,
                step: 0.05,
            },
            temperature: {
                value: lighting.temperature,
                min: 1800,
                max: 6500,
                step: 50,
                label: "warmth (K)",
            },
        },
        { collapsed: true }
    ) as LightingControls);
    // #endif

    // #if !DEBUG
    brightness = lighting.brightness;
    temperature = lighting.temperature;
    // #endif

    const color = useMemo(
        () => WHITE.clone().lerp(kelvinToColor(temperature), WARMTH_STRENGTH),
        [temperature]
    );

    return (
        <>
            {/* Soft fill from the ceiling with a warm bounce off the floor */}
            <hemisphereLight
                color={color}
                groundColor={FLOOR_BOUNCE_COLOR}
                intensity={AMBIENT_INTENSITY * brightness}
            />

            {/* Near-vertical key light so shadows fall beneath objects, as
                they do under ceiling lights */}
            <directionalLight
                position={[2, wallHeight * 2, 3]}
                color={color}
                intensity={KEY_INTENSITY * brightness}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-far={50}
                shadow-camera-left={-20}
                shadow-camera-right={20}
                shadow-camera-top={20}
                shadow-camera-bottom={-20}
            />

            {/* Ceiling fixtures */}
            {lighting.fixtures.map(({ x, y, z }) => (
                <pointLight
                    key={`${x},${z}`}
                    position={[x, y, z]}
                    color={color}
                    intensity={FIXTURE_INTENSITY * brightness}
                    decay={2}
                />
            ))}
        </>
    );
});
Lights.displayName = "Lights";

export default Lights;
