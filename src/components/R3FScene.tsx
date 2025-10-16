import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import Room from "./Room";
import Character from "./Character";
import Lights from "./Lights";
import Camera from "./Camera";
import { SceneProvider } from "../lib/contexts/SceneContext";
import { MessageProvider, useMessage } from "@/lib/contexts/MessageContext";
import Message from "@/components/Message";
import Terminal from "@/components/Terminal";
import { useExperience } from "@/lib/stores/useExperience";
import styles from "@/styles/R3FScene.module.scss";

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

const TERMINAL_TRANSITION_DURATION = 600;

function R3FSceneContent() {
        const [showCanvas, setShowCanvas] = useState(false);
        const { message, interaction, clearMessage } = useMessage();
        const { mode, isTransitioning, targetMode, exitTerminal } = useExperience(state => ({
                mode: state.mode,
                isTransitioning: state.isTransitioning,
                targetMode: state.targetMode,
                exitTerminal: state.exitTerminal,
        }));
        const [, setSelectedOption] = useState<string>("");
        const [isTerminalMounted, setIsTerminalMounted] = useState(false);
        const [isTerminalVisible, setIsTerminalVisible] = useState(false);
        const [isCanvasDimmed, setIsCanvasDimmed] = useState(false);
        const unmountTimeoutRef = useRef<number | null>(null);

        useEffect(() => {
                if (isTransitioning && targetMode === "terminal") {
                        if (unmountTimeoutRef.current) {
                                window.clearTimeout(unmountTimeoutRef.current);
                                unmountTimeoutRef.current = null;
                        }

                        setIsTerminalMounted(true);
                        setIsTerminalVisible(false);
                        setIsCanvasDimmed(false);
                }
        }, [isTransitioning, targetMode]);

        useEffect(() => {
                if (mode === "terminal" && !isTransitioning) {
                        setIsCanvasDimmed(true);
                        const frame = window.requestAnimationFrame(() => {
                                setIsTerminalVisible(true);
                        });

                        return () => {
                                window.cancelAnimationFrame(frame);
                        };
                }
        }, [isTransitioning, mode]);

        useEffect(() => {
                if (isTransitioning && targetMode === "scene") {
                        setIsTerminalVisible(false);
                        setIsCanvasDimmed(false);
                }
        }, [isTransitioning, targetMode]);

        useEffect(() => {
                if (!isTransitioning && mode === "scene") {
                        if (unmountTimeoutRef.current) {
                                window.clearTimeout(unmountTimeoutRef.current);
                        }

                        unmountTimeoutRef.current = window.setTimeout(() => {
                                setIsTerminalMounted(false);
                        }, TERMINAL_TRANSITION_DURATION);

                        return () => {
                                if (unmountTimeoutRef.current) {
                                        window.clearTimeout(unmountTimeoutRef.current);
                                }
                        };
                }
        }, [isTransitioning, mode]);

        useEffect(() => {
                if (mode === "terminal" && !isTransitioning) {
                        clearMessage();
                }
        }, [clearMessage, isTransitioning, mode]);

        useEffect(() => () => {
                if (unmountTimeoutRef.current) {
                        window.clearTimeout(unmountTimeoutRef.current);
                }
        }, []);

        useEffect(() => {
                setShowCanvas(true);
        }, []);

        useEffect(() => {
                const handleKeyDown = (event: KeyboardEvent) => {
                        if (event.key === "Enter" && interaction?.onEnter && mode === "scene" && !isTransitioning) {
                                event.preventDefault();
                                clearMessage();
                                interaction.onEnter();
                        }

                        if (event.key === "Escape" && mode === "terminal" && !isTransitioning) {
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
                if (isCanvasDimmed) {
                        classes.push(styles.canvasInactive);
                }

                return classes.join(" ");
        }, [isCanvasDimmed]);

        const terminalClasses = useMemo(() => {
                const classes = [styles.terminalLayer];

                if (isTerminalVisible) {
                        classes.push(styles.terminalVisible);
                }

                if (mode === "terminal" && !isTransitioning) {
                        classes.push(styles.terminalInteractive);
                }

                return classes.join(" ");
        }, [isTransitioning, isTerminalVisible, mode]);

        const shouldRenderTerminal = isTerminalMounted;

        return (
                <div className={styles.sceneContainer}>
                        <div className={canvasClassName}>
                                {showCanvas && (
                                        <KeyboardControls map={controls}>
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
                                                <Terminal onCommand={setSelectedOption} />
                                        </div>
                                </div>
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
