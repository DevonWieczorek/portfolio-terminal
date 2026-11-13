import { memo, useCallback, useMemo, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Leva } from "leva";
import styles from "@/styles/DebugPanel.module.scss";

const DEFAULT_WIDTH = 400;
const MIN_WIDTH = 280;

const DebugPanel = memo(() => {
    const panelRef = useRef<HTMLDivElement>(null);

    // Leva reports its accumulated drag offset, so it maps straight to a translate
    const titleBar = useMemo(
        () => ({
            onDrag: ({ x = 0, y = 0 }: { x?: number; y?: number }) => {
                const panel = panelRef.current;
                if (panel) panel.style.transform = `translate(${x}px, ${y}px)`;
            },
        }),
        []
    );

    // Width is written straight to the DOM so dragging never re-renders Leva
    const handlePointerDown = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            const panel = panelRef.current;
            if (!panel) return;

            event.preventDefault();
            const handle = event.currentTarget;
            const startX = event.clientX;
            const startWidth = panel.offsetWidth;
            handle.setPointerCapture(event.pointerId);

            const handlePointerMove = (moveEvent: PointerEvent) => {
                // Panel is anchored right, so dragging left widens it
                const width = startWidth + startX - moveEvent.clientX;
                const maxWidth = window.innerWidth - 20;
                panel.style.width = `${Math.min(Math.max(width, MIN_WIDTH), maxWidth)}px`;
            };

            const handlePointerUp = () => {
                handle.removeEventListener("pointermove", handlePointerMove);
                handle.removeEventListener("pointerup", handlePointerUp);
                handle.removeEventListener("pointercancel", handlePointerUp);
            };

            handle.addEventListener("pointermove", handlePointerMove);
            handle.addEventListener("pointerup", handlePointerUp);
            handle.addEventListener("pointercancel", handlePointerUp);
        },
        []
    );

    return (
        <div
            ref={panelRef}
            className={styles.panel}
            style={{ width: DEFAULT_WIDTH }}
        >
            <div
                className={styles.resizeHandle}
                onPointerDown={handlePointerDown}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize debug panel"
            />
            <Leva fill titleBar={titleBar} />
        </div>
    );
});
DebugPanel.displayName = "DebugPanel";

export default DebugPanel;
