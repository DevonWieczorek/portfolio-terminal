import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import Room from "./Room";
import Character from "./Character";
import Lights from "./Lights";
import Camera from "./Camera";
import { SceneProvider } from "../lib/contexts/SceneContext";
import { MessageProvider, useMessage } from "@/lib/contexts/MessageContext";
import Message from "@/components/Message";
import { useExperience } from "@/lib/stores/useExperience";

enum Controls {
        forward = "forward",
        backward = "backward",
        leftward = "leftward",
        rightward = "rightward",
}

const controls = [
        { name: Controls.forward, keys: ["KeyW", "ArrowUp"] },
        { name: Controls.backward, keys: ["KeyS", "ArrowDown"] },
        { name: Controls.leftward, keys: ["KeyA", "ArrowLeft"] },
        { name: Controls.rightward, keys: ["KeyD", "ArrowRight"] },
];

function R3FSceneContent() {
        const [showCanvas, setShowCanvas] = useState(false);
        const { message } = useMessage();
        const experience = useExperience(state => state.experience);
        const target = useExperience(state => state.target);

        useEffect(() => {
                setShowCanvas(true);
        }, []);

        return (
                <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
                        {showCanvas && (
                                <KeyboardControls map={controls}>
                                        <Canvas
                                                shadows
                                                frameloop={experience === "terminal" && target === "terminal" ? "demand" : "always"}
                                                camera={{
                                                        position: [0, 5, 10],
                                                        fov: 45,
                                                        near: 0.1,
                                                        far: 1000,
                                                }}
                                                gl={{
                                                        antialias: true,
                                                        powerPreference: "default",
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
                                </KeyboardControls>
                        )}
                        <Message text={message} />
                </div>
        );
}

function R3FScene() {
        return (
                <MessageProvider>
                        <SceneProvider>
                                <R3FSceneContent />
                        </SceneProvider>
                </MessageProvider>
        );
}

export default R3FScene;
