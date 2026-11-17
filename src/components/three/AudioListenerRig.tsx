import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useAudio } from "@/lib/stores/useAudio";

const UNLOCK_EVENTS = ["keydown", "pointerdown"] as const;

// Unlocks audio on the visitor's first key press or click, then mounts the
// shared listener on the camera so every sound in the room pans and fades
// as the view moves
export default function AudioListenerRig() {
    const { camera } = useThree();
    const listener = useAudio(state => state.listener);
    const unlock = useAudio(state => state.unlock);

    useEffect(() => {
        if (listener) {
            return;
        }
        UNLOCK_EVENTS.forEach(event =>
            window.addEventListener(event, unlock, { once: true })
        );
        return () =>
            UNLOCK_EVENTS.forEach(event =>
                window.removeEventListener(event, unlock)
            );
    }, [listener, unlock]);

    useEffect(() => {
        if (!listener) {
            return;
        }
        camera.add(listener);
        return () => {
            camera.remove(listener);
        };
    }, [camera, listener]);

    return null;
}
