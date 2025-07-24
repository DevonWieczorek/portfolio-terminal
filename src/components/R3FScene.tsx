import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
// import "@fontsource/inter";
import Room from "./Room";
import Character from "./Character";
import Lights from "./Lights";
import Camera from "./Camera";
// import { Interface } from "./ui/interface";
import { SceneProvider } from "../lib/contexts/SceneContext";

// Define control keys for the game
enum Controls {
	forward = 'forward',
	backward = 'backward',
	leftward = 'leftward',
	rightward = 'rightward',
}

const controls = [
	{ name: Controls.forward, keys: ["KeyW", "ArrowUp"] },
	{ name: Controls.backward, keys: ["KeyS", "ArrowDown"] },
	{ name: Controls.leftward, keys: ["KeyA", "ArrowLeft"] },
	{ name: Controls.rightward, keys: ["KeyD", "ArrowRight"] },
];

// Main R3FScene component
function R3FScene() {
	const [showCanvas, setShowCanvas] = useState(false);

	// Show the canvas once everything is loaded
	useEffect(() => {
		setShowCanvas(true);
	}, []);

	return (
		<SceneProvider>
			<div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
				{showCanvas && (
					<KeyboardControls map={controls}>
						<Canvas
							shadows
							camera={{
								position: [0, 5, 10],
								fov: 45,
								near: 0.1,
								far: 1000
							}}
							gl={{
								antialias: true,
								powerPreference: "default"
							}}
						>
							<color attach="background" args={["#87CEEB"]} />

							{/* Lighting */}
							<Lights />

							<Suspense fallback={null}>
								{/* Room environment */}
								<Room />

								{/* Character */}
								<Character />

								{/* Camera controller */}
								<Camera />
							</Suspense>
						</Canvas>
						{/* <Interface /> */}
					</KeyboardControls>
				)}
			</div>
		</SceneProvider>
	);
}

export default R3FScene;
