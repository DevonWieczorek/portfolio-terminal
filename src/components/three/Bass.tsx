import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";

interface BassProps {
	position: [number, number, number];
	scale?: [number, number, number];
	modelPath?: string;
}

const DEFAULT_MODEL = "/models/bass-1.glb";

const Bass = ({ position, scale = [1, 1, 1], modelPath = DEFAULT_MODEL }: BassProps) => {
	const { scene } = useGLTF(modelPath);

	// Clone the scene so multiple instances can exist in the scene graph
	const clonedScene = useMemo(() => scene.clone(true), [scene]);

	return (
		<primitive object={clonedScene} position={position} scale={scale} />
	);
};

export default Bass;