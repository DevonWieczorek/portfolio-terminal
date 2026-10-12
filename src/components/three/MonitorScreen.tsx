import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, Color, SRGBColorSpace } from "three";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";

type MonitorScreenControls = {
    screenX: number;
    screenY: number;
    screenZ: number;
    screenWidth: number;
    screenHeight: number;
    screenTilt: number;
    screenIntensity: number;
};

const PROMPT = "devon@portfolio:~$ ";
// Each entry is typed after the prompt, followed by its output lines
const SESSION: { command: string; output: string[] }[] = [
    { command: "whoami", output: ["Devon Wieczorek"] },
    { command: "help", output: ["resume  contact  ask  fun-fact"] },
    { command: "echo $HINT", output: ["Press ENTER to log in"] },
];

const TEXTURE_WIDTH = 512;
const FONT_SIZE = 26;
const LINE_HEIGHT = 34;
const PADDING = 24;
const CHARS_PER_SECOND = 14;
const CURSOR_BLINK_SECONDS = 0.5;
// Pause on the finished session before clearing and typing it again
const LOOP_PAUSE_SECONDS = 6;
const SCANLINE_SPACING = 4;

// Flatten the session into the full text of each line plus how many of its
// characters are typed (prompts and output appear instantly)
type ScreenLine = { prefix: string; typed: string };
const SCREEN_LINES: ScreenLine[] = SESSION.flatMap(({ command, output }) => [
    { prefix: PROMPT, typed: command },
    ...output.map(line => ({ prefix: line, typed: "" })),
]);
const TOTAL_TYPED_CHARS = SCREEN_LINES.reduce(
    (total, line) => total + line.typed.length,
    0
);
const TYPING_SECONDS = TOTAL_TYPED_CHARS / CHARS_PER_SECOND;
const LOOP_SECONDS = TYPING_SECONDS + LOOP_PAUSE_SECONDS;

function drawScreen(
    context: CanvasRenderingContext2D,
    textColor: string,
    visibleChars: number,
    showCursor: boolean
) {
    const { width, height } = context.canvas;

    context.fillStyle = "#000";
    context.fillRect(0, 0, width, height);

    context.font = `${FONT_SIZE}px monospace`;
    context.textBaseline = "top";
    context.fillStyle = textColor;

    let remaining = visibleChars;
    let cursorX = PADDING;
    let cursorY = PADDING;

    for (let index = 0; index < SCREEN_LINES.length; index++) {
        const { prefix, typed } = SCREEN_LINES[index];
        const text = prefix + typed.slice(0, remaining);
        const y = PADDING + index * LINE_HEIGHT;

        context.fillText(text, PADDING, y);
        cursorX = PADDING + context.measureText(text).width;
        cursorY = y;

        if (remaining < typed.length) {
            break;
        }

        remaining -= typed.length;

        // Once everything is typed, the cursor waits on a fresh prompt
        if (index === SCREEN_LINES.length - 1) {
            const promptY = y + LINE_HEIGHT;
            context.fillText(PROMPT, PADDING, promptY);
            cursorX = PADDING + context.measureText(PROMPT).width;
            cursorY = promptY;
        }
    }

    if (showCursor) {
        context.fillRect(cursorX, cursorY, FONT_SIZE * 0.55, FONT_SIZE);
    }

    // CRT scanlines
    context.fillStyle = "rgba(0, 0, 0, 0.35)";
    for (let y = 0; y < height; y += SCANLINE_SPACING) {
        context.fillRect(0, y, width, 1);
    }

    // Darken the edges like a curved CRT
    const vignette = context.createRadialGradient(
        width / 2,
        height / 2,
        height * 0.3,
        width / 2,
        height / 2,
        width * 0.65
    );
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.7)");
    context.fillStyle = vignette;
    context.fillRect(0, 0, width, height);
}

const MonitorScreen = memo(() => {
    const { monitorScreen } = useScene();
    // Encodes the last drawn frame so the texture only re-uploads on change
    const lastFrameKeyRef = useRef("");

    let screenX: number,
        screenY: number,
        screenZ: number,
        screenWidth: number,
        screenHeight: number,
        screenTilt: number,
        screenIntensity: number;

    // #if DEBUG
    ({
        screenX,
        screenY,
        screenZ,
        screenWidth,
        screenHeight,
        screenTilt,
        screenIntensity,
    } = useControls(
        "Monitor Screen",
        {
            screenX: {
                value: monitorScreen?.position?.x ?? 0,
                min: -1,
                max: 1,
                step: 0.001,
            },
            screenY: {
                value: monitorScreen?.position?.y ?? 0,
                min: -1,
                max: 1,
                step: 0.001,
            },
            screenZ: {
                value: monitorScreen?.position?.z ?? 0,
                min: -1,
                max: 1,
                step: 0.001,
            },
            screenWidth: {
                value: monitorScreen?.width ?? 1,
                min: 0.1,
                max: 1,
                step: 0.001,
            },
            screenHeight: {
                value: monitorScreen?.height ?? 1,
                min: 0.1,
                max: 1,
                step: 0.001,
            },
            screenTilt: {
                value: monitorScreen?.rotation?.x ?? 0,
                min: -0.5,
                max: 0.5,
                step: 0.001,
            },
            screenIntensity: {
                value: monitorScreen?.intensity ?? 1,
                min: 0,
                max: 5,
                step: 0.1,
            },
        },
        { collapsed: true }
    ) as MonitorScreenControls);
    // #endif

    // #if !DEBUG
    screenX = monitorScreen?.position?.x ?? 0;
    screenY = monitorScreen?.position?.y ?? 0;
    screenZ = monitorScreen?.position?.z ?? 0;
    screenWidth = monitorScreen?.width ?? 1;
    screenHeight = monitorScreen?.height ?? 1;
    screenTilt = monitorScreen?.rotation?.x ?? 0;
    screenIntensity = monitorScreen?.intensity ?? 1;
    // #endif

    const screenFacing = monitorScreen?.rotation?.y ?? 0;
    const textColor = monitorScreen?.color ?? "#00ff00";

    const texture = useMemo(() => {
        const canvas = document.createElement("canvas");
        canvas.width = TEXTURE_WIDTH;
        canvas.height = Math.round(
            (TEXTURE_WIDTH * screenHeight) / screenWidth
        );

        const canvasTexture = new CanvasTexture(canvas);
        canvasTexture.colorSpace = SRGBColorSpace;
        return canvasTexture;
    }, [screenHeight, screenWidth]);

    useEffect(() => {
        lastFrameKeyRef.current = "";
        return () => texture.dispose();
    }, [texture]);

    // Scale the texture into HDR so the text crosses the bloom threshold
    const materialColor = useMemo(
        () => new Color(1, 1, 1).multiplyScalar(screenIntensity),
        [screenIntensity]
    );

    useFrame(({ clock }) => {
        const context = (texture.image as HTMLCanvasElement).getContext("2d");

        if (!context) {
            return;
        }

        const loopTime = clock.elapsedTime % LOOP_SECONDS;
        const visibleChars = Math.min(
            TOTAL_TYPED_CHARS,
            Math.floor(loopTime * CHARS_PER_SECOND)
        );
        // Keep the cursor solid while typing, like a real terminal
        const showCursor =
            loopTime < TYPING_SECONDS ||
            Math.floor(loopTime / CURSOR_BLINK_SECONDS) % 2 === 0;
        const frameKey = `${visibleChars}:${showCursor}:${textColor}`;

        if (frameKey === lastFrameKeyRef.current) {
            return;
        }

        lastFrameKeyRef.current = frameKey;
        drawScreen(context, textColor, visibleChars, showCursor);
        texture.needsUpdate = true;
    });

    return (
        <group
            position={[screenX, screenY, screenZ]}
            rotation={[0, screenFacing, 0]}
        >
            <mesh rotation={[screenTilt, 0, 0]}>
                <planeGeometry args={[screenWidth, screenHeight]} />
                <meshBasicMaterial
                    map={texture}
                    color={materialColor}
                    toneMapped={false}
                />
            </mesh>
        </group>
    );
});
MonitorScreen.displayName = "MonitorScreen";

export default MonitorScreen;
