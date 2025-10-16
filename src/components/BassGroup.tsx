import { useGLTF } from "@react-three/drei";
import { useControls, folder } from 'leva';
import { useScene } from "@/lib/contexts/SceneContext";
import Bass from "@/components/Bass";
import InteractiveBox from "@/components/InteractiveBox";

const NUM_BASSES = 4;
const BASS_MODEL_PATH = "/models/bass-1.glb";
// Subtracting 1.5 from i ensures the group of 4 basses is centered on bassX, not offset to one side.
const GROUP_CENTER_OFFSET = (NUM_BASSES - 1) / 2;
const BASS_MESSAGE = "Devon is the bassist and co-vocalist of an alternative Punk Rock band called Friend Z.";

const BassGroup = ({ proximityPosition }: { proximityPosition: PositionArray }) => {
	const { bass } = useScene();

	const {
		bassX,
		bassY,
		bassZ,
		bassScale,
		bassSpacing,
	} = useControls({
		Bass: folder({
			bassX: { value: bass?.position?.x, min: -20, max: 10, step: 0.01 },
			bassY: { value: bass?.position?.y, min: -10, max: 10, step: 0.01 },
			bassZ: { value: bass?.position?.z, min: -20, max: 10, step: 0.01 },
			bassScale: { value: bass?.scale, min: 0.1, max: 10, step: 0.1 },
			bassSpacing: { value: bass?.spacing, min: 0.5, max: 5, step: 0.1 },
		}, { collapsed: true }),
	});

	return (
		<InteractiveBox
			message={BASS_MESSAGE}
			position={[bassX, 0, bassZ]}
			proximityPosition={proximityPosition}
		>
			<group>
				{Array.from({ length: NUM_BASSES }).map((_, i) => (
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
				))}
			</group>
		</InteractiveBox>
	);
};


useGLTF.preload(BASS_MODEL_PATH);
export default BassGroup;