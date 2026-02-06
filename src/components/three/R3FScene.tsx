import { memo } from "react";
import React, { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import Room from "@/components/three/Room";
import Character from "@/components/three/Character";
import Lights from "@/components/three/Lights";
import Camera from "@/components/three/Camera";
import { SceneProvider } from "@/lib/contexts/SceneContext";
import { MessageProvider, useMessage } from "@/lib/contexts/MessageContext";
import Message from "@/components/three/Message";
import Terminal from "@/components/Terminal";
import { useExperience } from "@/lib/stores/useExperience";
import styles from "@/styles/R3FScene.module.scss";

enum Controls {
    forward = "forward",
    backward = "backward",
    leftward = "leftward",
    rightward = "rightward",
}

const CONTROLS = [
    { name: Controls.forward, keys: ["KeyW", "ArrowUp"] },
    { name: Controls.backward, keys: ["KeyS", "ArrowDown"] },
    { name: Controls.leftward, keys: ["KeyA", "ArrowLeft"] },
    { name: Controls.rightward, keys: ["KeyD", "ArrowRight"] },
];

const R3FSceneContent = memo(() => {
    const [showCanvas, setShowCanvas] = useState(false);
    const { message, interaction, clearMessage } = useMessage();
    // Use individual selectors to prevent unnecessary rerenders
    const mode = useExperience(state => state.mode);
    const isTransitioning = useExperience(state => state.isTransitioning);
    const targetMode = useExperience(state => state.targetMode);
    const isBlackout = useExperience(state => state.isBlackout);
    const exitTerminal = useExperience(state => state.exitTerminal);
    const [, setSelectedOption] = useState<string>("");

    useEffect(() => {
        setShowCanvas(true);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                event.key === "Enter" &&
                interaction?.onEnter &&
                mode === "scene" &&
                !isTransitioning
            ) {
                event.preventDefault();
                clearMessage();
                interaction.onEnter();
            }

            if (
                event.key === "Escape" &&
                mode === "terminal" &&
                !isTransitioning
            ) {
                event.preventDefault();
                exitTerminal();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [interaction, mode, isTransitioning, clearMessage, exitTerminal]);

    const canvasClassName = useMemo(() => {
        const classes = [styles.canvasLayer];
        const isTerminalActive = mode === "terminal" && !isTransitioning;
        const isEnteringBlackout = isBlackout && targetMode === "terminal";

        if (isTerminalActive || isEnteringBlackout) {
            classes.push(styles.canvasInactive);
        }

        return classes.join(" ");
    }, [isBlackout, isTransitioning, mode, targetMode]);

    const terminalClasses = useMemo(() => {
        const classes = [styles.terminalLayer];

        if (
            mode === "terminal" ||
            (isTransitioning && targetMode === "terminal" && isBlackout)
        ) {
            classes.push(styles.terminalVisible);
        }

        if (mode === "terminal" && !isTransitioning) {
            classes.push(styles.terminalInteractive);
        }

        return classes.join(" ");
    }, [isBlackout, isTransitioning, mode, targetMode]);

    const shouldRenderTerminal =
        mode === "terminal" || (isTransitioning && targetMode === "terminal");
    const isTerminalActive = mode === "terminal" && !isTransitioning;

    useEffect(() => {
        if (isTransitioning && targetMode === "terminal") {
            clearMessage();
        }
    }, [clearMessage, isTransitioning, targetMode]);

    return (
        <div className={styles.sceneContainer}>
            <div className={canvasClassName}>
                {showCanvas && (
                    <KeyboardControls map={CONTROLS}>
                        <Canvas
                            shadows
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
            </div>
            {shouldRenderTerminal && (
                <div className={terminalClasses}>
                    <div className={styles.terminalWrapper}>
                        <Terminal
                            onCommand={setSelectedOption}
                            isActive={isTerminalActive}
                        />
                    </div>
                </div>
            )}
            <div
                className={[
                    styles.blackoutOverlay,
                    isBlackout ? styles.blackoutVisible : "",
                ].join(" ")}
            />
            <Message text={message} />
        </div>
    );
});
R3FSceneContent.displayName = "R3FSceneContent";

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
