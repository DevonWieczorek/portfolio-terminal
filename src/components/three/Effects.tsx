import { memo } from "react";
import {
    Bloom,
    EffectComposer,
    N8AO,
    ToneMapping,
    Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";

type EffectsControls = {
    bloomIntensity: number;
    bloomThreshold: number;
    bloomSmoothing: number;
    aoIntensity: number;
    aoRadius: number;
    vignetteOffset: number;
    vignetteDarkness: number;
};

const Effects = memo(() => {
    const { effects } = useScene();

    let bloomIntensity: number,
        bloomThreshold: number,
        bloomSmoothing: number,
        aoIntensity: number,
        aoRadius: number,
        vignetteOffset: number,
        vignetteDarkness: number;

    // #if DEBUG
    ({
        bloomIntensity,
        bloomThreshold,
        bloomSmoothing,
        aoIntensity,
        aoRadius,
        vignetteOffset,
        vignetteDarkness,
    } = useControls(
        "Effects",
        {
            bloomIntensity: {
                value: effects.bloomIntensity,
                min: 0,
                max: 5,
                step: 0.05,
            },
            bloomThreshold: {
                value: effects.bloomThreshold,
                min: 0,
                max: 2,
                step: 0.01,
            },
            bloomSmoothing: {
                value: effects.bloomSmoothing,
                min: 0,
                max: 1,
                step: 0.01,
            },
            aoIntensity: {
                value: effects.aoIntensity,
                min: 0,
                max: 10,
                step: 0.1,
            },
            aoRadius: {
                value: effects.aoRadius,
                min: 0.1,
                max: 8,
                step: 0.1,
            },
            vignetteOffset: {
                value: effects.vignetteOffset,
                min: 0,
                max: 1,
                step: 0.01,
            },
            vignetteDarkness: {
                value: effects.vignetteDarkness,
                min: 0,
                max: 1,
                step: 0.01,
            },
        },
        { collapsed: true }
    ) as EffectsControls);
    // #endif

    // #if !DEBUG
    bloomIntensity = effects.bloomIntensity;
    bloomThreshold = effects.bloomThreshold;
    bloomSmoothing = effects.bloomSmoothing;
    aoIntensity = effects.aoIntensity;
    aoRadius = effects.aoRadius;
    vignetteOffset = effects.vignetteOffset;
    vignetteDarkness = effects.vignetteDarkness;
    // #endif

    return (
        <EffectComposer>
            {/* Darkens creases and contact points (wall corners, feet on the
                floor) so objects feel grounded; half res keeps it cheap */}
            <N8AO
                halfRes
                quality="medium"
                intensity={aoIntensity}
                aoRadius={aoRadius}
            />
            <Bloom
                mipmapBlur
                intensity={bloomIntensity}
                luminanceThreshold={bloomThreshold}
                luminanceSmoothing={bloomSmoothing}
            />
            {/* The composer disables the renderer's tone mapping, so restore
                R3F's default ACES look as the final pass */}
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            {/* After tone mapping so it darkens the final image evenly */}
            <Vignette offset={vignetteOffset} darkness={vignetteDarkness} />
        </EffectComposer>
    );
});
Effects.displayName = "Effects";

export default Effects;
