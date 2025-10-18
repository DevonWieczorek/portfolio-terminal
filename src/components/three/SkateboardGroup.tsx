import { useGLTF } from "@react-three/drei";
import { useControls, folder } from 'leva';
import { useScene } from "@/lib/contexts/SceneContext";
import Skateboard from "@/components/three/Skateboard";
import InteractiveBox from "@/components/three/InteractiveBox";

const NUM_DECKS = 4;
const DECK_MODEL_PATH = "/models/skateboard_deck_2.glb";
// Subtracting 1.5 from i ensures the group of 4 decks is centered on deckX, not offset to one side.
const GROUP_CENTER_OFFSET = (NUM_DECKS - 1) / 2;
const SKATEBOARD_MESSAGE = "In 2018, Devon and his brother started a skateboard company called Brew Crew Skateboards.";

const SkateboardGroup = ({ proximityPosition }: { proximityPosition: PositionArray }) => {
	const { deck, rotations } = useScene();

	const {
		deckX,
		deckY,
		deckZ,
		deckScale,
		deckSpacing,
	} = useControls({
		Skateboard: folder({
			deckX: { value: deck?.position?.x, min: -20, max: 20, step: 0.01 },
			deckY: { value: deck?.position?.y, min: -10, max: 10, step: 0.01 },
			deckZ: { value: deck?.position?.z, min: -20, max: 20, step: 0.01 },
			deckScale: { value: deck?.scale, min: 0.1, max: 10, step: 0.1 },
			deckSpacing: { value: deck?.spacing, min: 0.5, max: 5, step: 0.1 },
		}, { collapsed: true }),
	});

	return (
		<InteractiveBox
			message={SKATEBOARD_MESSAGE}
			position={[deckX, 0, deckZ]}
			proximityPosition={proximityPosition}
			rotation={[0, rotations.clockwise, 0]}
		>
			{/* Skateboards */}
			<group>
				{Array.from({ length: NUM_DECKS }).map((_, i) => (
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
				))}
			</group>

		</InteractiveBox>
	);
};

useGLTF.preload(DECK_MODEL_PATH);
export default SkateboardGroup;