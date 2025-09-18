import { useGLTF } from "@react-three/drei";
import { useControls, folder } from 'leva';
import { useScene } from "@/lib/contexts/SceneContext";
import Skateboard from "@/components/Skateboard";

const NUM_DECKS = 4;
const DECK_MODEL_PATH = "/models/skateboard_deck_2.glb";
// Subtracting 1.5 from i ensures the group of 4 deckes is centered on deckX, not offset to one side.
const GROUP_CENTER_OFFSET = (NUM_DECKS - 1) / 2;

const SkateboardGroup = () => {
	const { deck, rotations } = useScene();

	const {
		deckX,
		deckY,
		deckZ,
		deckScale,
		deckSpacing,
	} = useControls({
		Skateboard: folder({
			deckX: { value: deck?.position?.x, min: -20, max: 10, step: 0.01 },
			deckY: { value: deck?.position?.y, min: -10, max: 10, step: 0.01 },
			deckZ: { value: deck?.position?.z, min: -20, max: 10, step: 0.01 },
			deckScale: { value: deck?.scale, min: 0.1, max: 10, step: 0.1 },
			deckSpacing: { value: deck?.spacing, min: 0.5, max: 5, step: 0.1 },
		}),
	});

	return (
		<group rotation={[0, rotations.clockwise, 0]}>
			{Array.from({ length: NUM_DECKS }).map((_, i) => (
				<Skateboard
					key={i}
					position={[
						deckX + (i - GROUP_CENTER_OFFSET) * deckSpacing,
						deckY,
						deckZ,
					]}
					scale={[deckScale, deckScale, deckScale]}
					modelPath={DECK_MODEL_PATH}
				/>
			))}
		</group>
	);
};


useGLTF.preload(DECK_MODEL_PATH);
export default SkateboardGroup;