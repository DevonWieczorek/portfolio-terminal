import { memo, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";
import Skateboard from "@/components/three/Skateboard";
import InteractiveBox from "@/components/three/InteractiveBox";

type DeckControls = {
    deckX: number;
    deckY: number;
    deckZ: number;
    deckScale: number;
    deckSpacing: number;
    proximityX: number;
    proximityY: number;
    proximityZ: number;
};

const NUM_DECKS = 4;
const DECK_MODEL_PATH = "/models/skateboard_deck_2.glb";
// Subtracting 1.5 from i ensures the group of 4 decks is centered on deckX, not offset to one side.
const GROUP_CENTER_OFFSET = (NUM_DECKS - 1) / 2;
const SKATEBOARD_MESSAGE =
    "In 2018, Devon and his brother started a skateboard company called Brew Crew Skateboards.";

const SkateboardGroup = memo(
    ({ proximityPosition }: { proximityPosition: PositionArray }) => {
        const { deck, rotations } = useScene();

        let deckX, deckY, deckZ, deckScale, deckSpacing;
        let proximityX, proximityY, proximityZ;

        // #if DEBUG
        ({ deckX, deckY, deckZ, deckScale, deckSpacing } = useControls(
            "Skateboard",
            {
                deckX: {
                    value: deck?.position?.x ?? 0,
                    min: -20,
                    max: 20,
                    step: 0.01,
                },
                deckY: {
                    value: deck?.position?.y ?? 0,
                    min: -10,
                    max: 10,
                    step: 0.01,
                },
                deckZ: {
                    value: deck?.position?.z ?? 0,
                    min: -20,
                    max: 20,
                    step: 0.01,
                },
                deckScale: {
                    value: deck?.scale ?? 0,
                    min: 0.1,
                    max: 10,
                    step: 0.1,
                },
                deckSpacing: {
                    value: deck?.spacing ?? 0,
                    min: 0.5,
                    max: 5,
                    step: 0.1,
                },
                proximityX: {
                    value: Math.max(0.1, Math.abs(deck?.position?.x ?? 0)),
                    min: 0.1,
                    max: 20,
                    step: 0.01,
                },
                proximityY: {
                    value: 0.1,
                    min: 0.1,
                    max: 20,
                    step: 0.01,
                },
                proximityZ: {
                    value: Math.max(0.1, Math.abs(deck?.position?.z ?? 0)),
                    min: 0.1,
                    max: 20,
                    step: 0.01,
                },
            },
            { collapsed: true }
        ) as DeckControls);
        // #endif

        // #if !DEBUG
        deckX = deck?.position?.x;
        deckY = deck?.position?.y;
        deckZ = deck?.position?.z;
        deckScale = deck?.scale;
        deckSpacing = deck?.spacing;
        proximityX = Math.max(0.1, Math.abs(deck?.position?.x ?? 0));
        proximityY = 0.1;
        proximityZ = Math.max(0.1, Math.abs(deck?.position?.z ?? 0));
        // #endif

        // Memoize skateboard elements to prevent recreation on every render
        const skateboardElements = useMemo(
            () =>
                Array.from({ length: NUM_DECKS }).map((_, i) => (
                    <Skateboard
                        key={i}
                        position={[
                            (i - GROUP_CENTER_OFFSET) * deckSpacing,
                            deckY,
                            0,
                        ]}
                        scale={[deckScale, deckScale, deckScale]}
                        modelPath={DECK_MODEL_PATH}
                    />
                )),
            [deckSpacing, deckY, deckScale]
        );

        return (
            <InteractiveBox
                message={SKATEBOARD_MESSAGE}
                position={[deckX, 0, deckZ]}
                proximityPosition={proximityPosition}
                rotation={[0, rotations.clockwise, 0]}
                triggerBox={[proximityX, proximityY, proximityZ]}
            >
                {/* Skateboards */}
                <group>{skateboardElements}</group>
            </InteractiveBox>
        );
    }
);
SkateboardGroup.displayName = "SkateboardGroup";

useGLTF.preload(DECK_MODEL_PATH);
export default SkateboardGroup;
