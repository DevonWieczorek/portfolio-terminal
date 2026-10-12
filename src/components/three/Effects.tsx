import { memo } from "react";
import {
    Bloom,
    EffectComposer,
    ToneMapping,
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
};

const Effects = memo(() => {
    const { effects } = useScene();

    let bloomIntensity: number, bloomThreshold: number, bloomSmoothing: number;

    // #if DEBUG
    ({ bloomIntensity, bloomThreshold, bloomSmoothing } = useControls(
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
        },
        { collapsed: true }
    ) as EffectsControls);
    // #endif

    // #if !DEBUG
    bloomIntensity = effects.bloomIntensity;
    bloomThreshold = effects.bloomThreshold;
    bloomSmoothing = effects.bloomSmoothing;
    // #endif

    return (
        <EffectComposer>
            <Bloom
                mipmapBlur
                intensity={bloomIntensity}
                luminanceThreshold={bloomThreshold}
                luminanceSmoothing={bloomSmoothing}
            />
            {/* The composer disables the renderer's tone mapping, so restore
                R3F's default ACES look as the final pass */}
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
    );
});
Effects.displayName = "Effects";

export default Effects;
