import React from "react";
import * as THREE from "three";

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

export const frameCallbacks: Array<() => void> = [];

export const mockCamera = {
    position: new THREE.Vector3(0, 0, 0),
    lookAt: jest.fn(),
};

export const useFrameMock = jest.fn((cb: () => void) => {
    frameCallbacks.push(cb);
});

export const useThreeMock = jest.fn(() => ({ camera: mockCamera }));

export const useGLTFMock = jest.fn((_: string) => ({
    scene: new THREE.Group(),
}));
export const useGLTFPreloadMock = jest.fn();
const useGLTFModuleMock = Object.assign((path: string) => useGLTFMock(path), {
    preload: useGLTFPreloadMock,
});

export const useTextureMock = jest.fn((_: string) => ({
    wrapS: 0,
    wrapT: 0,
    repeat: { set: jest.fn() },
    needsUpdate: false,
}));

export const keyboardState = {
    forward: false,
    backward: false,
    leftward: false,
    rightward: false,
};

export const subscribeMock = jest.fn(() => jest.fn());
export const getKeysMock = jest.fn(() => keyboardState);

export const sceneState = {
    roomSize: 30,
    wallColor: "#F5F5DC",
    wallHeight: 12,
    wallThickness: 1,
    characterBoundary: 28,
    cameraBuffer: 2,
    characterSpeed: 0.1,
    characterScale: 1.75,
    cameraOffset: { x: 0, y: 8, z: 18 },
    zoomSettings: { min: 0.5, max: 2, speed: 0.1, default: 1 },
    desk: {
        height: 4,
        scale: 2,
        position: { x: -12, y: 0, z: -10 },
    },
    monitor: {
        position: { x: -0.5, y: 1.5, z: 2.6 },
        rotation: { y: -1 },
        boxSize: { x: 5, y: 2, z: 3 },
        boxAnchor: { x: 0, y: 0, z: 0 },
        approachYawOffset: Math.PI / 4,
    },
    bass: {
        position: { x: -1, y: 4, z: -14 },
        scale: 3.5,
        spacing: 5,
        boxSize: { x: 15, y: 18, z: 5 },
        boxAnchor: { x: 1, y: 0, z: 0 },
    },
    deck: {
        position: { x: 14, y: 4, z: -1 },
        scale: 3,
        spacing: 5,
        boxSize: { x: 20, y: 12, z: 5 },
        boxAnchor: { x: 0, y: 0, z: 0 },
    },
    rotations: {
        clockwise: -Math.PI / 2,
        counterclockwise: Math.PI / 2,
    },
};

export const messageState = {
    message: "",
    interaction: null as { onEnter?: () => void } | null,
    setMessage: jest.fn(),
    clearMessage: jest.fn(),
};

export const movementState = {
    position: { x: 0, y: 1, z: 0 },
    setPosition: jest.fn(),
    resetPosition: jest.fn(),
};

export const experienceState = {
    mode: "scene" as "scene" | "terminal",
    targetMode: "scene" as "scene" | "terminal",
    isTransitioning: false,
    cameraOverride: null,
    isBlackout: false,
    enterTerminal: jest.fn(),
    exitTerminal: jest.fn(),
    startBlackout: jest.fn(),
    completeTransition: jest.fn(),
};

const useSceneMock = jest.fn(() => sceneState);
const useMessageMock = jest.fn(() => messageState);
const useExperienceMock = jest.fn(
    (selector?: (state: typeof experienceState) => unknown) =>
        selector ? selector(experienceState) : experienceState
);

const useMovementMock = jest.fn(
    (selector?: (state: typeof movementState) => unknown) =>
        selector ? selector(movementState) : movementState
) as jest.Mock & {
    getState: () => typeof movementState;
};
useMovementMock.getState = () => movementState;

jest.mock("@react-three/fiber", () => ({
    __esModule: true,
    default: {},
    Canvas: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="canvas">{children}</div>
    ),
    useFrame: (cb: () => void) => useFrameMock(cb),
    useThree: () => useThreeMock(),
}));

jest.mock("@react-three/drei", () => ({
    __esModule: true,
    useGLTF: useGLTFModuleMock,
    useTexture: (path: string) => useTextureMock(path),
    useKeyboardControls: () => [subscribeMock, getKeysMock],
    KeyboardControls: ({ children }: { children: React.ReactNode }) => (
        <>{children}</>
    ),
}));

jest.mock("@/utils/three", () => ({
    getModelDimensions: jest.fn(),
}));

jest.mock("@/lib/contexts/SceneContext", () => ({
    useScene: () => useSceneMock(),
    SceneProvider: ({ children }: { children: React.ReactNode }) => (
        <>{children}</>
    ),
}));

jest.mock("@/lib/contexts/MessageContext", () => ({
    useMessage: () => useMessageMock(),
    MessageProvider: ({ children }: { children: React.ReactNode }) => (
        <>{children}</>
    ),
}));

jest.mock("@/lib/stores/useMovement", () => ({
    useMovement: useMovementMock,
}));

jest.mock("@/lib/stores/useExperience", () => ({
    useExperience: (selector?: (state: typeof experienceState) => unknown) =>
        useExperienceMock(selector),
}));

jest.mock("@/components/Terminal", () => ({
    __esModule: true,
    default: ({ isActive }: { isActive: boolean }) => (
        <div data-testid="terminal" data-active={String(isActive)} />
    ),
}));

beforeAll(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
        const message = String(args[0] ?? "");
        const isWarning = message.startsWith("Warning:");

        if (isWarning) {
            return;
        }

        originalConsoleError(...args);
    });
});

afterAll(() => {
    (console.warn as jest.Mock).mockRestore();
    (console.error as jest.Mock).mockRestore();
    console.warn = originalConsoleWarn;
});

export function resetThreeTestState() {
    jest.clearAllMocks();
    frameCallbacks.length = 0;
    keyboardState.forward = false;
    keyboardState.backward = false;
    keyboardState.leftward = false;
    keyboardState.rightward = false;
    experienceState.mode = "scene";
    experienceState.targetMode = "scene";
    experienceState.isTransitioning = false;
    experienceState.cameraOverride = null;
    experienceState.isBlackout = false;
    messageState.message = "";
    messageState.interaction = null;
    movementState.position = { x: 0, y: 1, z: 0 };
}

export function runFrameCallbacks() {
    frameCallbacks.forEach(cb => cb());
}
