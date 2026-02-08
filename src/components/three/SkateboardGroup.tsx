import { memo, useCallback, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";
import Skateboard from "@/components/three/Skateboard";
import InteractiveBox from "@/components/three/InteractiveBox";
// #if DEBUG
import type { InteractiveBounds } from "@/components/three/InteractiveBox";
// #endif

type DeckControls = {
    deckX: number;
    deckY: number;
    deckZ: number;
    deckScale: number;
    deckSpacing: number;
    deckBoxSizeX: number;
    deckBoxSizeY: number;
    deckBoxSizeZ: number;
    deckBoxAnchorX: number;
    deckBoxAnchorY: number;
    deckBoxAnchorZ: number;
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
        // #if DEBUG
        const shouldSeedBoxControlsRef = useRef(true);
        const setControlsRef = useRef<
            ((value: Partial<DeckControls>) => void) | null
        >(null);
        // #endif

        let deckX, deckY, deckZ, deckScale, deckSpacing;
        let deckBoxSizeX,
            deckBoxSizeY,
            deckBoxSizeZ,
            deckBoxAnchorX,
            deckBoxAnchorY,
            deckBoxAnchorZ;
        let deckInteractiveSize: [number, number, number] | undefined =
            undefined;
        let deckInteractiveCenter: [number, number, number] | undefined =
            undefined;

        // #if DEBUG
        const [deckControls, setDeckControls] = useControls(
            "Skateboard",
            () => ({
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
                deckBoxSizeX: {
                    value: deck?.boxSize?.x ?? 20,
                    min: 0.1,
                    max: 40,
                    step: 0.01,
                },
                deckBoxSizeY: {
                    value: deck?.boxSize?.y ?? 12,
                    min: 0.1,
                    max: 40,
                    step: 0.01,
                },
                deckBoxSizeZ: {
                    value: deck?.boxSize?.z ?? 5,
                    min: 0.1,
                    max: 40,
                    step: 0.01,
                },
                deckBoxAnchorX: {
                    value: deck?.boxAnchor?.x ?? 0,
                    min: -20,
                    max: 20,
                    step: 0.01,
                },
                deckBoxAnchorY: {
                    value: deck?.boxAnchor?.y ?? 0,
                    min: -20,
                    max: 20,
                    step: 0.01,
                },
                deckBoxAnchorZ: {
                    value: deck?.boxAnchor?.z ?? 0,
                    min: -20,
                    max: 20,
                    step: 0.01,
                },
            }),
            { collapsed: true }
        ) as [
            DeckControls,
            (value: Partial<DeckControls>) => void,
            <T extends keyof DeckControls>(path: T) => DeckControls[T],
        ];
        ({
            deckX,
            deckY,
            deckZ,
            deckScale,
            deckSpacing,
            deckBoxSizeX,
            deckBoxSizeY,
            deckBoxSizeZ,
            deckBoxAnchorX,
            deckBoxAnchorY,
            deckBoxAnchorZ,
        } = deckControls);
        setControlsRef.current = setDeckControls;
        deckInteractiveSize = [deckBoxSizeX, deckBoxSizeY, deckBoxSizeZ];
        deckInteractiveCenter = [
            deckBoxAnchorX,
            deckBoxAnchorY,
            deckBoxAnchorZ,
        ];
        // #endif

        // #if !DEBUG
        deckX = deck?.position?.x;
        deckY = deck?.position?.y;
        deckZ = deck?.position?.z;
        deckScale = deck?.scale;
        deckSpacing = deck?.spacing;
        deckBoxSizeX = deck?.boxSize?.x ?? 20;
        deckBoxSizeY = deck?.boxSize?.y ?? 12;
        deckBoxSizeZ = deck?.boxSize?.z ?? 5;
        deckBoxAnchorX = deck?.boxAnchor?.x ?? 0;
        deckBoxAnchorY = deck?.boxAnchor?.y ?? 0;
        deckBoxAnchorZ = deck?.boxAnchor?.z ?? 0;
        deckInteractiveSize = [deckBoxSizeX, deckBoxSizeY, deckBoxSizeZ];
        deckInteractiveCenter = [
            deckBoxAnchorX,
            deckBoxAnchorY,
            deckBoxAnchorZ,
        ];
        // #endif

        // #if DEBUG
        const handleBoundsResolved = useCallback(
            (bounds: InteractiveBounds) => {
                const setControls = setControlsRef.current;

                if (!shouldSeedBoxControlsRef.current || !setControls) {
                    return;
                }

                setControls({
                    deckBoxSizeX: bounds.size[0],
                    deckBoxSizeY: bounds.size[1],
                    deckBoxSizeZ: bounds.size[2],
                    deckBoxAnchorX: bounds.center[0],
                    deckBoxAnchorY: bounds.center[1],
                    deckBoxAnchorZ: bounds.center[2],
                });

                shouldSeedBoxControlsRef.current = false;
            },
            []
        );
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
            <group
                position={[deckX, 0, deckZ]}
                rotation={[0, rotations.clockwise, 0]}
            >
                {/* Skateboards */}
                <group>{skateboardElements}</group>
                <InteractiveBox
                    message={SKATEBOARD_MESSAGE}
                    proximityPosition={proximityPosition}
                    // #if DEBUG
                    onResolvedBounds={handleBoundsResolved}
                    // #endif
                    size={deckInteractiveSize}
                    center={deckInteractiveCenter}
                />
            </group>
        );
    }
);
SkateboardGroup.displayName = "SkateboardGroup";

useGLTF.preload(DECK_MODEL_PATH);
export default SkateboardGroup;
