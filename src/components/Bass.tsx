import { useGLTF } from "@react-three/drei";
import { useControls, folder } from 'leva';
import { useScene } from "../lib/contexts/SceneContext";

const Bass = () => {
	const bassModel = useGLTF('/models/bass-1.glb');
	const { bass } = useScene();

	const {
		bassX,
		bassY,
		bassZ,
		bassScale
	} = useControls({
		Bass: folder({
			bassX: { value: bass?.position?.x, min: -20, max: 10, step: 0.01 }, // 0
			bassY: { value: bass?.position?.y, min: -10, max: 10, step: 0.01 }, // wallHeight / 2
			bassZ: { value: bass?.position?.z, min: -20, max: 10, step: 0.01 }, // -roomSize / 2
			bassScale: { value: bass?.scale, min: 0.1, max: 10, step: 0.01 },
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