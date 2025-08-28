import React, { useRef, useState, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Vector3 } from "three";

// Tooltip component that appears in 3D space
function TooltipText({ position, visible, content }) {
	return (
		<Text
			position={[position[0], position[1] + 1.5, position[2]]}
			fontSize={0.3}
			color="white"
			anchorX="center"
			anchorY="middle"
			visible={visible}
		>
			{visible ? content : null}
			<meshBasicMaterial transparent opacity={visible ? 1 : 0} />
		</Text>
	);
}

interface InteractiveBoxProps {
	position: [number, number, number];
	tooltipContent: string | ReactNode;
	triggerDistance?: number;
	proximityPosition?: Vector3; // <-- new prop
}


// Interactive object with proximity detection
function InteractiveBox({
	position,
	tooltipContent,
	triggerDistance = 3,
	proximityPosition,
}: InteractiveBoxProps) {
	const meshRef = useRef();
	const [showTooltip, setShowTooltip] = useState(false);
	const { camera } = useThree();

	useFrame(() => {
		if (meshRef.current) {
			// Use character position or default to camera position 
			const targetPos = proximityPosition ?? camera.position;

			// Calculate distance between character/camera and object
			const distance = targetPos.distanceTo(meshRef.current.position);

			// // Show tooltip when close enough
			setShowTooltip(distance < triggerDistance);
		}
	});

	return (
		<>
			<mesh ref={meshRef} position={position} visible={false}>
				<boxGeometry args={[1, 1, 1]} />
			</mesh>

			<TooltipText
				position={position}
				visible={showTooltip}
				content={tooltipContent}
			/>
		</>
	);
}

export default InteractiveBox;