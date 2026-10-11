import { memo, useCallback, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";
import Bass from "@/components/three/Bass";
import InteractiveBox from "@/components/three/InteractiveBox";
// #if DEBUG
import type { InteractiveBounds } from "@/components/three/InteractiveBox";
// #endif

type BassControls = {
    bassX: number;
    bassY: number;
    bassZ: number;
    bassScale: number;
    bassSpacing: number;
    bassBoxSizeX: number;
    bassBoxSizeY: number;
    bassBoxSizeZ: number;
    bassBoxAnchorX: number;
    bassBoxAnchorY: number;
    bassBoxAnchorZ: number;
};

const NUM_BASSES = 4;
const BASS_MODEL_PATH = "/models/bass-guitar-configurable.glb";
// Subtracting 1.5 from i ensures the group of 4 basses is centered on bassX, not offset to one side.
const GROUP_CENTER_OFFSET = (NUM_BASSES - 1) / 2;
const BASS_MESSAGE = `
    Devon is the bassist and co-vocalist of an alternative Punk Rock band called
    <a href="https://linktr.ee/friend_z" target="_blank" rel="noopener noreferrer">Friend Z</a>.
`;

const BassGroup = memo(
    ({ proximityPosition }: { proximityPosition: PositionArray }) => {
        const { bass } = useScene();
        // #if DEBUG
        const shouldSeedBoxControlsRef = useRef(true);
        const setControlsRef = useRef<
            ((value: Partial<BassControls>) => void) | null
        >(null);
        // #endif

        let bassX: number,
            bassY: number,
            bassZ: number,
            bassScale: number,
            bassSpacing: number;
        let bassBoxSizeX: number,
            bassBoxSizeY: number,
            bassBoxSizeZ: number,
            bassBoxAnchorX: number,
            bassBoxAnchorY: number,
            bassBoxAnchorZ: number;
        let bassInteractiveSize: Coordinate;
        let bassInteractiveCenter: Coordinate;

        // #if DEBUG
        const [bassControls, setBassControls] = useControls(
            "Bass",
            () => ({
                bassX: {
                    value: bass?.position?.x ?? 0,
                    min: -20,
                    max: 10,
                    step: 0.01,
                },
                bassY: {
                    value: bass?.position?.y ?? 0,
                    min: -10,
                    max: 10,
                    step: 0.01,
                },
                bassZ: {
                    value: bass?.position?.z ?? 0,
                    min: -20,
                    max: 10,
                    step: 0.01,
                },
                bassScale: {
                    value: bass?.scale ?? 0,
                    min: 0.1,
                    max: 10,
                    step: 0.1,
                },
                bassSpacing: {
                    value: bass?.spacing ?? 0,
                    min: 0.5,
                    max: 5,
                    step: 0.1,
                },
                bassBoxSizeX: {
                    value: bass?.boxSize?.x ?? 15,
                    min: 0.1,
                    max: 40,
                    step: 0.01,
                },
                bassBoxSizeY: {
                    value: bass?.boxSize?.y ?? 18,
                    min: 0.1,
                    max: 40,
                    step: 0.01,
                },
                bassBoxSizeZ: {
                    value: bass?.boxSize?.z ?? 5,
                    min: 0.1,
                    max: 40,
                    step: 0.01,
                },
                bassBoxAnchorX: {
                    value: bass?.boxAnchor?.x ?? 1,
                    min: -20,
                    max: 20,
                    step: 0.01,
                },
                bassBoxAnchorY: {
                    value: bass?.boxAnchor?.y ?? 0,
                    min: -20,
                    max: 20,
                    step: 0.01,
                },
                bassBoxAnchorZ: {
                    value: bass?.boxAnchor?.z ?? 0,
                    min: -20,
                    max: 20,
                    step: 0.01,
                },
            }),
            { collapsed: true }
        ) as [
            BassControls,
            (value: Partial<BassControls>) => void,
            <T extends keyof BassControls>(path: T) => BassControls[T],
        ];
        ({
            bassX,
            bassY,
            bassZ,
            bassScale,
            bassSpacing,
            bassBoxSizeX,
            bassBoxSizeY,
            bassBoxSizeZ,
            bassBoxAnchorX,
            bassBoxAnchorY,
            bassBoxAnchorZ,
        } = bassControls);
        setControlsRef.current = setBassControls;
        bassInteractiveSize = [bassBoxSizeX, bassBoxSizeY, bassBoxSizeZ];
        bassInteractiveCenter = [
            bassBoxAnchorX,
            bassBoxAnchorY,
            bassBoxAnchorZ,
        ];
        // #endif

        // #if !DEBUG
        bassX = bass?.position?.x ?? 0;
        bassY = bass?.position?.y ?? 0;
        bassZ = bass?.position?.z ?? 0;
        bassScale = bass?.scale ?? 0;
        bassSpacing = bass?.spacing ?? 0;
        bassBoxSizeX = bass?.boxSize?.x ?? 15;
        bassBoxSizeY = bass?.boxSize?.y ?? 18;
        bassBoxSizeZ = bass?.boxSize?.z ?? 5;
        bassBoxAnchorX = bass?.boxAnchor?.x ?? 1;
        bassBoxAnchorY = bass?.boxAnchor?.y ?? 0;
        bassBoxAnchorZ = bass?.boxAnchor?.z ?? 0;
        bassInteractiveSize = [bassBoxSizeX, bassBoxSizeY, bassBoxSizeZ];
        bassInteractiveCenter = [
            bassBoxAnchorX,
            bassBoxAnchorY,
            bassBoxAnchorZ,
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
                    bassBoxSizeX: bounds.size[0],
                    bassBoxSizeY: bounds.size[1],
                    bassBoxSizeZ: bounds.size[2],
                    bassBoxAnchorX: bounds.center[0],
                    bassBoxAnchorY: bounds.center[1],
                    bassBoxAnchorZ: bounds.center[2],
                });

                shouldSeedBoxControlsRef.current = false;
            },
            []
        );
        // #endif

        // Memoize bass elements to prevent recreation on every render
        const bassElements = useMemo(
            () =>
                Array.from({ length: NUM_BASSES }).map((_, i) => (
                    <Bass
                        key={i}
                        position={[
                            (i - GROUP_CENTER_OFFSET) * bassSpacing,
                            bassY,
                            0,
                        ]}
                        scale={[bassScale, bassScale, bassScale]}
                        modelPath={BASS_MODEL_PATH}
                    />
                )),
            [bassSpacing, bassY, bassScale]
        );

        return (
            <group position={[bassX, 0, bassZ]}>
                <group>{bassElements}</group>
                <InteractiveBox
                    message={BASS_MESSAGE}
                    proximityPosition={proximityPosition}
                    // #if DEBUG
                    onResolvedBounds={handleBoundsResolved}
                    // #endif
                    size={bassInteractiveSize}
                    center={bassInteractiveCenter}
                />
            </group>
        );
    }
);
BassGroup.displayName = "BassGroup";

useGLTF.preload(BASS_MODEL_PATH);
export default BassGroup;
