import React from "react";
import * as THREE from "three";

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

type FrameState = { clock: { elapsedTime: number } };
type FrameCallback = (state: FrameState, delta: number) => void;

export const frameCallbacks: FrameCallback[] = [];

export const mockCamera = {
    position: new THREE.Vector3(0, 0, 0),
    lookAt: jest.fn(),
};

export const useFrameMock = jest.fn((cb: FrameCallback) => {
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

const createTextureMock = () => ({
    wrapS: 0,
    wrapT: 0,
    repeat: { set: jest.fn() },
    anisotropy: 1,
    colorSpace: "",
    needsUpdate: false,
});

// Mirrors drei: a single path returns one texture, a map of paths returns a
// map of textures
export const useTextureMock = jest.fn(
    (paths: string | Record<string, string>) =>
        typeof paths === "string"
            ? createTextureMock()
            : Object.fromEntries(
                  Object.keys(paths).map(key => [key, createTextureMock()])
              )
);

export const useTexturePreloadMock = jest.fn();
const useTextureModuleMock = Object.assign(
    (paths: string | Record<string, string>) => useTextureMock(paths),
    { preload: useTexturePreloadMock }
);

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
    floorSurface: {
        textures: {
            map: "/textures/floor_albedo.jpg",
            normalMap: "/textures/floor_normal.jpg",
            roughnessMap: undefined,
        },
        tileSize: 6.562,
        roughness: 0.7,
        normalScale: 1,
    },
    wallSurface: {
        textures: {
            map: "/textures/wall_albedo.jpg",
        },
        tileSize: 3.281,
        roughness: 0.9,
        normalScale: 0.6,
    },
    characterBoundary: 28,
    cameraBuffer: 2,
    characterSpeed: 0.1,
    characterHeight: 6,
    characterAppearance: {
        skinColor: "#f7d0b4",
        shirtColor: "#6593c6",
        pantsColor: "#3b4252",
        featureColor: "#2b2623",
        roughness: 0.75,
    },
    cameraOffset: { x: 0, y: 5, z: 18 },
    cameraLookAtHeight: 3.5,
    zoomSettings: { min: 0.5, max: 2, speed: 0.1, default: 1 },
    desk: {
        scale: 2.5,
        position: { x: -14.5, y: 0, z: -14.5 },
        footprint: {
            width: 6.4,
            depth: 5.6,
            backArmDepth: 2.1,
            sideArmWidth: 2.3,
        },
    },
    monitor: {
        scale: 1.2,
        position: { x: -0.5, y: 1.5, z: 2.6 },
        rotation: { y: -1 },
        boxSize: { x: 5, y: 2, z: 3 },
        boxAnchor: { x: 0, y: 0, z: 0 },
        approachYawOffset: Math.PI / 4,
    },
    monitorScreen: {
        width: 0.6,
        height: 0.5,
        position: { x: 0.39, y: 0.105, z: 0 },
        rotation: { x: -0.1, y: Math.PI / 2 },
        color: "#00ff00",
        intensity: 1.6,
    },
    lighting: {
        brightness: 1,
        temperature: 3000,
        fixtures: [
            { x: -7, y: 11.5, z: -7 },
            { x: -7, y: 11.5, z: 7 },
            { x: 7, y: 11.5, z: -7 },
            { x: 7, y: 11.5, z: 7 },
        ],
    },
    effects: {
        bloomIntensity: 1.2,
        bloomThreshold: 1,
        bloomSmoothing: 0.3,
        aoIntensity: 3,
        aoRadius: 2,
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
    useFrame: (cb: FrameCallback) => useFrameMock(cb),
    useThree: () => useThreeMock(),
}));

jest.mock("@react-three/drei", () => ({
    __esModule: true,
    useGLTF: useGLTFModuleMock,
    useTexture: useTextureModuleMock,
    useKeyboardControls: () => [subscribeMock, getKeysMock],
    RoundedBox: ({ children }: { children?: React.ReactNode }) => (
        <mesh>{children}</mesh>
    ),
    KeyboardControls: ({ children }: { children: React.ReactNode }) => (
        <>{children}</>
    ),
}));

jest.mock("@react-three/postprocessing", () => ({
    __esModule: true,
    EffectComposer: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="effect-composer">{children}</div>
    ),
    N8AO: (props: Record<string, unknown>) => (
        <div
            data-testid="n8ao"
            data-intensity={String(props.intensity)}
            data-radius={String(props.aoRadius)}
        />
    ),
    Bloom: (props: Record<string, unknown>) => (
        <div
            data-testid="bloom"
            data-intensity={String(props.intensity)}
            data-threshold={String(props.luminanceThreshold)}
        />
    ),
    ToneMapping: ({ mode }: { mode: number }) => (
        <div data-testid="tone-mapping" data-mode={String(mode)} />
    ),
}));

jest.mock("postprocessing", () => ({
    __esModule: true,
    ToneMappingMode: { ACES_FILMIC: 6 },
}));

jest.mock("@/utils/three", () => ({
    getModelDimensions: jest.fn(),
    getBackOffset: jest.fn(() => 0),
    getModelBounds: jest.fn(() => new THREE.Box3()),
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

export function runFrameCallbacks(elapsedTime = 0, delta = 1 / 60) {
    frameCallbacks.forEach(cb => cb({ clock: { elapsedTime } }, delta));
}
