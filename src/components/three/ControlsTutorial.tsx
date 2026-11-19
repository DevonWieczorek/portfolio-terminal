import { memo, useEffect, useState, type CSSProperties } from "react";
import styles from "@/styles/ControlsTutorial.module.scss";

type StepId = "walk" | "turn" | "pan" | "zoom";

interface KeyCap {
    code: string;
    label: string;
    name: string;
}

interface Step {
    id: StepId;
    label: string;
    keys: KeyCap[];
    hint?: string;
    arrows?: boolean;
}

const STEPS: Step[] = [
    {
        id: "walk",
        label: "Walk",
        arrows: true,
        keys: [
            { code: "ArrowUp", label: "↑", name: "Up arrow" },
            { code: "ArrowLeft", label: "←", name: "Left arrow" },
            { code: "ArrowDown", label: "↓", name: "Down arrow" },
            { code: "ArrowRight", label: "→", name: "Right arrow" },
        ],
    },
    {
        id: "turn",
        label: "Turn camera",
        keys: [
            { code: "KeyA", label: "A", name: "A" },
            { code: "KeyD", label: "D", name: "D" },
        ],
    },
    {
        id: "pan",
        label: "Slide camera",
        keys: [
            { code: "KeyW", label: "W", name: "W" },
            { code: "KeyS", label: "S", name: "S" },
        ],
    },
    {
        id: "zoom",
        label: "Zoom",
        hint: "or scroll",
        keys: [
            { code: "KeyI", label: "I", name: "I" },
            { code: "KeyO", label: "O", name: "O" },
        ],
    },
];

const STEP_BY_CODE = new Map(
    STEPS.flatMap(step => step.keys.map(key => [key.code, step.id] as const))
);

export const COMPLETE_DELAY_MS = 1400;
export const EXIT_DURATION_MS = 250;
const REOPEN_KEY = "KeyH";

interface ControlsTutorialProps {
    isOpen: boolean;
    // False while the room is loading or the player is at the computer or
    // inspecting something, so H doesn't reopen the card over those views
    canOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
}

// Game-style "how to play" card. Each control ticks off once the player has
// tried it, and the card closes itself when they've tried them all.
const ControlsTutorial = memo(
    ({ isOpen, canOpen, onOpen, onClose }: ControlsTutorialProps) => {
        const [isRendered, setIsRendered] = useState(isOpen);
        const [pressed, setPressed] = useState<ReadonlySet<string>>(new Set());
        const [tried, setTried] = useState<ReadonlySet<StepId>>(new Set());
        const isComplete = tried.size === STEPS.length;

        useEffect(() => {
            if (isOpen) {
                setIsRendered(true);
                setTried(new Set());
                return;
            }
            const timeout = window.setTimeout(
                () => setIsRendered(false),
                EXIT_DURATION_MS
            );
            return () => window.clearTimeout(timeout);
        }, [isOpen]);

        useEffect(() => {
            if (!isOpen) {
                return;
            }
            const markTried = (id: StepId) =>
                setTried(prev => (prev.has(id) ? prev : new Set(prev).add(id)));

            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.code === "Enter" || event.code === "Escape") {
                    event.preventDefault();
                    onClose();
                    return;
                }
                const step = STEP_BY_CODE.get(event.code);
                if (!step || event.repeat) {
                    return;
                }
                markTried(step);
                setPressed(prev => new Set(prev).add(event.code));
            };
            const handleKeyUp = (event: KeyboardEvent) =>
                setPressed(prev => {
                    if (!prev.has(event.code)) {
                        return prev;
                    }
                    const next = new Set(prev);
                    next.delete(event.code);
                    return next;
                });
            const handleWheel = () => markTried("zoom");
            const clearPressed = () => setPressed(new Set());

            window.addEventListener("keydown", handleKeyDown);
            window.addEventListener("keyup", handleKeyUp);
            window.addEventListener("wheel", handleWheel, { passive: true });
            window.addEventListener("blur", clearPressed);
            return () => {
                window.removeEventListener("keydown", handleKeyDown);
                window.removeEventListener("keyup", handleKeyUp);
                window.removeEventListener("wheel", handleWheel);
                window.removeEventListener("blur", clearPressed);
                clearPressed();
            };
        }, [isOpen, onClose]);

        useEffect(() => {
            if (!isOpen || !isComplete) {
                return;
            }
            const timeout = window.setTimeout(onClose, COMPLETE_DELAY_MS);
            return () => window.clearTimeout(timeout);
        }, [isComplete, isOpen, onClose]);

        useEffect(() => {
            if (isOpen || !canOpen) {
                return;
            }
            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.code === REOPEN_KEY && !event.repeat) {
                    onOpen();
                }
            };
            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }, [canOpen, isOpen, onOpen]);

        if (!isRendered) {
            return canOpen ? (
                <button
                    type="button"
                    className={styles.reopen}
                    onClick={onOpen}
                    aria-label="Show controls"
                >
                    <kbd className={styles.key}>H</kbd>
                    <span>Controls</span>
                </button>
            ) : null;
        }

        return (
            <div
                className={[styles.card, isOpen ? "" : styles.closing].join(
                    " "
                )}
                style={
                    {
                        "--exit-duration": `${EXIT_DURATION_MS}ms`,
                    } as CSSProperties
                }
                role="dialog"
                aria-labelledby="controls-tutorial-title"
            >
                <p className={styles.kicker}>How to play</p>
                <h2 id="controls-tutorial-title" className={styles.title}>
                    Welcome to Devon&apos;s office!
                </h2>
                <p className={styles.subtitle}>
                    A 3D interactive resume. Give each control a try:
                </p>

                <ul className={styles.steps}>
                    {STEPS.map((step, index) => {
                        const isTried = tried.has(step.id);
                        return (
                            <li
                                key={step.id}
                                className={[
                                    styles.step,
                                    isTried ? styles.tried : "",
                                ].join(" ")}
                                style={{ "--index": index } as CSSProperties}
                            >
                                <span
                                    className={styles.check}
                                    aria-label={
                                        isTried ? "Done" : "Not tried yet"
                                    }
                                    role="img"
                                >
                                    ✓
                                </span>
                                <span
                                    className={
                                        step.arrows
                                            ? styles.arrowKeys
                                            : styles.keys
                                    }
                                >
                                    {step.keys.map(key => (
                                        <kbd
                                            key={key.code}
                                            className={[
                                                styles.key,
                                                pressed.has(key.code)
                                                    ? styles.pressed
                                                    : "",
                                            ].join(" ")}
                                            aria-label={key.name}
                                        >
                                            {key.label}
                                        </kbd>
                                    ))}
                                </span>
                                <span className={styles.label}>
                                    {step.label}
                                </span>
                                {step.hint && (
                                    <span className={styles.hint}>
                                        {step.hint}
                                    </span>
                                )}
                            </li>
                        );
                    })}
                </ul>

                <p className={styles.tip}>
                    Walk up to anything that catches your eye. When a bubble
                    pops up, press <kbd className={styles.inlineKey}>Enter</kbd>{" "}
                    to check it out and{" "}
                    <kbd className={styles.inlineKey}>Esc</kbd> to step back.
                </p>

                <div className={styles.footer}>
                    {isComplete ? (
                        <p className={styles.done}>
                            All set! Have fun exploring.
                        </p>
                    ) : (
                        <button
                            type="button"
                            className={styles.start}
                            onClick={onClose}
                        >
                            Press <kbd className={styles.inlineKey}>Enter</kbd>{" "}
                            to start
                        </button>
                    )}
                </div>
            </div>
        );
    }
);
ControlsTutorial.displayName = "ControlsTutorial";

export default ControlsTutorial;
