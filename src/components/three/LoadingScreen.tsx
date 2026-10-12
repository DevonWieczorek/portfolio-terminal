"use client";

import { memo, useEffect, useRef, useState, type CSSProperties } from "react";
import { useProgress } from "@react-three/drei";
import { useScene } from "@/lib/contexts/SceneContext";
import styles from "@/styles/LoadingScreen.module.scss";

export const REVEAL_DURATION_MS = 1200;
const SEGMENT_COUNT = 10;
const VISIBLE_LINES = 4;

// First matching keyword wins, so more specific asset names come first.
const ASSET_LABELS: [RegExp, string][] = [
    [/desk\.glb/i, "assembling desk"],
    [/monitor/i, "plugging in monitor"],
    [/bass/i, "tuning bass"],
    [/deck/i, "waxing skate decks"],
    [/floor/i, "laying floorboards"],
    [/wall/i, "painting walls"],
    [/wood/i, "sanding wood"],
    [/heart/i, "finding a heart"],
];

// Textures embedded in GLBs load as anonymous blob URLs, so they're skipped.
export const labelForAsset = (url: string): string | null => {
    if (/^(blob|data):/.test(url)) {
        return null;
    }
    const match = ASSET_LABELS.find(([pattern]) => pattern.test(url));
    if (match) {
        return match[1];
    }
    const file = url.split("/").pop() ?? url;
    return `loading ${file.replace(/\.[^.]+$/, "")}`;
};

type Phase = "loading" | "revealing" | "done";

interface LoadingScreenProps {
    isReady: boolean;
}

const LoadingScreen = memo(({ isReady }: LoadingScreenProps) => {
    const { loaderMinDuration } = useScene();
    const { progress, item } = useProgress();
    const mountedAt = useRef(0);
    const [lines, setLines] = useState<string[]>([]);
    const [phase, setPhase] = useState<Phase>("loading");

    useEffect(() => {
        const label = item ? labelForAsset(item) : null;
        if (!label) {
            return;
        }
        setLines(prev => (prev.includes(label) ? prev : [...prev, label]));
    }, [item]);

    useEffect(() => {
        mountedAt.current = performance.now();
    }, []);

    useEffect(() => {
        if (!isReady) {
            return;
        }
        const elapsed = performance.now() - mountedAt.current;
        const wait = Math.max(0, loaderMinDuration - elapsed);
        const revealTimeout = window.setTimeout(
            () => setPhase("revealing"),
            wait
        );
        const doneTimeout = window.setTimeout(
            () => setPhase("done"),
            wait + REVEAL_DURATION_MS
        );
        return () => {
            window.clearTimeout(revealTimeout);
            window.clearTimeout(doneTimeout);
        };
    }, [isReady, loaderMinDuration]);

    if (phase === "done") {
        return null;
    }

    // The loader can report 100% before the scene has mounted, so hold at
    // 99 until the room says it's ready.
    const percent = isReady ? 100 : Math.min(Math.round(progress), 99);
    const filledSegments = Math.round((percent / 100) * SEGMENT_COUNT);
    const visibleLines = lines.slice(-VISIBLE_LINES);

    return (
        <div
            className={[
                styles.overlay,
                phase === "revealing" ? styles.revealing : "",
            ].join(" ")}
            style={
                {
                    "--reveal-duration": `${REVEAL_DURATION_MS}ms`,
                } as CSSProperties
            }
            role="status"
            aria-live="polite"
            aria-label="Loading room"
        >
            <div className={styles.toy}>
                <div className={styles.body}>
                    <div className={styles.monitor}>
                        <div className={styles.screen}>
                            <p className={styles.line}>&gt; booting room.exe</p>
                            {visibleLines.map((line, index) => {
                                const isCurrent =
                                    !isReady &&
                                    index === visibleLines.length - 1;
                                return (
                                    <p key={line} className={styles.line}>
                                        <span>&gt; {line}</span>
                                        <span className={styles.status}>
                                            {isCurrent ? "..." : "ok"}
                                        </span>
                                    </p>
                                );
                            })}
                            {isReady ? (
                                <p className={styles.line}>&gt; welcome in!</p>
                            ) : (
                                <span className={styles.cursor} />
                            )}
                            <div className={styles.flash} />
                        </div>
                    </div>
                    <div className={styles.stand} />
                </div>
                <div className={styles.shadow} />
            </div>

            <div
                className={styles.progress}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
            >
                {Array.from({ length: SEGMENT_COUNT }, (_, index) => (
                    <span
                        key={index}
                        className={[
                            styles.segment,
                            index < filledSegments ? styles.filled : "",
                        ].join(" ")}
                    />
                ))}
            </div>
            <p className={styles.percent}>{percent}%</p>
        </div>
    );
});
LoadingScreen.displayName = "LoadingScreen";

export default LoadingScreen;
