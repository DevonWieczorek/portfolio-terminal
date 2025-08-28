import { useGLTF } from "@react-three/drei";
import { useControls, folder } from 'leva';
// import { useScene } from "../lib/contexts/SceneContext";

const Bass = () => {
	const bassModel = useGLTF('/models/bass-1.glb');
	// const { roomSize, wallHeight, wallThickness } = useScene();

	const {
		bassX,
		bassY,
		bassZ,
		bassScale
	} = useControls({
		Bass: folder({
			bassX: { value: -1, min: -20, max: 10, step: 0.01 }, // 0
			bassY: { value: 6, min: -10, max: 10, step: 0.01 }, // wallHeight / 2
			bassZ: { value: -14, min: -20, max: 10, step: 0.01 }, // -roomSize / 2
			bassScale: { value: 3, min: 0.1, max: 10, step: 0.01 },
		}),
	});

	return (
		<primitive
			object={bassModel.scene}
			position={[bassX, bassY, bassZ]}
			scale={[bassScale, bassScale, bassScale]}
		/>
	);
};

useGLTF.preload('/models/monitor.glb');

export default Bass;