import { useRef, useEffect, useState, ReactNode } from 'react';
import * as THREE from 'three';

interface BoundingBoxProps {
	children: ReactNode;
	color?: string;
	opacity?: number;
	padding?: number;
	visible?: boolean;
	wireframe?: boolean;
}

const BoundingBox = ({
	children,
	color = '#3b82f6',
	opacity = 0.3,
	padding = 0.5,
	visible = true,
	wireframe = false,
}: BoundingBoxProps) => {
	const groupRef = useRef<THREE.Group>(null);
	const [boxSize, setBoxSize] = useState<[number, number, number]>([1, 1, 1]);
	const [boxCenter, setBoxCenter] = useState<[number, number, number]>([0, 0, 0]);

	useEffect(() => {
		if (groupRef.current) {
			// Calculate bounding box of all children
			const box = new THREE.Box3().setFromObject(groupRef.current);

			// Get size and center
			const size = new THREE.Vector3();
			box.getSize(size);

			const center = new THREE.Vector3();
			box.getCenter(center);

			// Add padding on all sides
			setBoxSize([
				size.x + padding * 2,
				size.y + padding * 2,
				size.z + padding * 2,
			]);

			setBoxCenter([center.x, center.y, center.z]);
		}
	}, [padding, children]);

	return (
		<group>
			{/* Background box */}
			{visible && (
				<mesh position={boxCenter}>
					<boxGeometry args={boxSize} />
					<meshBasicMaterial
						color={color}
						transparent
						opacity={opacity}
						side={THREE.DoubleSide}
						wireframe={wireframe}
					/>
				</mesh>
			)}

			{/* Children content */}
			<group ref={groupRef}>
				{children}
			</group>
		</group>
	);
};

export default BoundingBox;