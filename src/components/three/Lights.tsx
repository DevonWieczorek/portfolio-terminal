import { memo, useMemo } from "react";
import { Color, Object3D } from "three";
import { Environment, Lightformer } from "@react-three/drei";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";
import { kelvinToColor } from "@/utils/color";

type LightingControls = {
    brightness: number;
    temperature: number;
    environmentIntensity: number;
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
// Reflection-only light panels baked into the environment map. Pastel rims
// from either side give rounded edges a cartoon-style two-tone highlight.
const ENV_PANEL_INTENSITY = 2;
const ENV_PANEL_SIZE = 4;
const ENV_RIM_INTENSITY = 0.8;
const ENV_RIM_COLORS = ["#ffb38a", "#7fd6e0"];
const ENV_RESOLUTION = 256;
// Padding around the room for the key light's shadow frustum; fitting it to
// the room spends the whole shadow map on visible floor
const SHADOW_MARGIN = 1;

type FixtureLightProps = {
    position: [number, number, number];
    color: Color;
    intensity: number;
};

// A downlight that lights the whole hemisphere below it, matching a point
// light there, but leaves the ceiling just above it unlit instead of
// blowing it out. The soft edge fades the light out near the tops of the
// walls instead of cutting it off.
const FIXTURE_PENUMBRA = 0.1;

const FixtureLight = ({ position, color, intensity }: FixtureLightProps) => {
    const target = useMemo(() => new Object3D(), []);
    const [x, , z] = position;

    return (
        <>
            <spotLight
                position={position}
                target={target}
                color={color}
                intensity={intensity}
                angle={Math.PI / 2}
                penumbra={FIXTURE_PENUMBRA}
                decay={2}
            />
            {/* The target must be in the scene for its world position to
                update, so the light points straight down */}
            <primitive object={target} position={[x, 0, z]} />
        </>
    );
};

const Lights = memo(() => {
    const { lighting, wallHeight, roomSize } = useScene();
    const shadowExtent = roomSize / 2 + SHADOW_MARGIN;

    let brightness: number, temperature: number, environmentIntensity: number;

    // #if DEBUG
    ({ brightness, temperature, environmentIntensity } = useControls(
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
            environmentIntensity: {
                value: lighting.environmentIntensity,
                min: 0,
                max: 2,
                step: 0.05,
                label: "reflections",
            },
        },
        { collapsed: true }
    ) as LightingControls);
    // #endif

    // #if !DEBUG
    brightness = lighting.brightness;
    temperature = lighting.temperature;
    environmentIntensity = lighting.environmentIntensity;
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
                shadow-camera-far={wallHeight * 4}
                shadow-camera-left={-shadowExtent}
                shadow-camera-right={shadowExtent}
                shadow-camera-top={shadowExtent}
                shadow-camera-bottom={-shadowExtent}
                // Offsets keep the textured floor and walls from shadowing
                // themselves (acne) without detaching shadows from objects
                shadow-bias={-0.0005}
                shadow-normalBias={0.02}
            />

            {/* Ceiling fixtures */}
            {lighting.fixtures.map(({ x, y, z }) => (
                <FixtureLight
                    key={`${x},${z}`}
                    position={[x, y, z]}
                    color={color}
                    intensity={FIXTURE_INTENSITY * brightness}
                />
            ))}

            {/* Rendered once into a cube map, so remount it when the color
                changes to rebake the reflections */}
            <Environment
                key={temperature}
                resolution={ENV_RESOLUTION}
                environmentIntensity={environmentIntensity * brightness}
            >
                {lighting.fixtures.map(({ x, y, z }) => (
                    <Lightformer
                        key={`${x},${z}`}
                        form="rect"
                        color={color}
                        intensity={ENV_PANEL_INTENSITY}
                        position={[x, y, z]}
                        rotation-x={Math.PI / 2}
                        scale={ENV_PANEL_SIZE}
                    />
                ))}
                {ENV_RIM_COLORS.map((rimColor, i) => {
                    const side = i === 0 ? -1 : 1;
                    return (
                        <Lightformer
                            key={rimColor}
                            form="rect"
                            color={rimColor}
                            intensity={ENV_RIM_INTENSITY}
                            position={[
                                (side * roomSize) / 2,
                                wallHeight / 2,
                                0,
                            ]}
                            rotation-y={(-side * Math.PI) / 2}
                            scale={[roomSize, wallHeight / 2, 1]}
                        />
                    );
                })}
            </Environment>
        </>
    );
});
Lights.displayName = "Lights";

export default Lights;
