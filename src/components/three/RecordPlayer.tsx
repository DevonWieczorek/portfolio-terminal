import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
    AudioContext as ThreeAudioContext,
    AudioListener,
    AudioLoader,
    LoadingManager,
    MathUtils,
    type Object3D,
    type PositionalAudio as PositionalAudioImpl,
} from "three";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";
import InteractionZone from "@/components/three/InteractionZone";

type RecordPlayerControls = {
    spinSpeed: number;
    spinEase: number;
    tonearmPlayAngle: number;
    tonearmEase: number;
    volume: number;
    audioRefDistance: number;
    recordBoxSizeX: number;
    recordBoxSizeY: number;
    recordBoxSizeZ: number;
    recordBoxAnchorX: number;
    recordBoxAnchorY: number;
    recordBoxAnchorZ: number;
};

interface RecordPlayerProps {
    // The loaded shelf model, which holds the turntable's moving parts
    model: Object3D;
    // The shelf model's scale, so the music comes from the turntable
    scale: number;
}

// "A cup of tea" by TAD, CC0: https://opengameart.org/content/lofi-compilation
// MP3 because every browser can decode it through Web Audio; AAC is not
// supported everywhere
const RECORD_AUDIO_PATH = "/audio/a-cup-of-tea.mp3";
const DROP_MESSAGE = "Press ENTER to drop the needle.";
const LIFT_MESSAGE = "Press ENTER to lift the needle.";
// The music waits until the arm has swung this close to the record
const NEEDLE_DOWN_TOLERANCE = 0.02;
const AT_REST = 1e-3;

// Browsers only start audio from a user gesture, and three creates its shared
// context lazily, so create and resume it while the key press is handled
const unlockAudio = () => {
    if (typeof window === "undefined" || !("AudioContext" in window)) {
        return;
    }
    void ThreeAudioContext.getContext().resume();
};

const RecordPlayer = memo(function RecordPlayer({
    model,
    scale,
}: RecordPlayerProps) {
    const { recordPlayer } = useScene();
    const { camera } = useThree();
    const [isPlaying, setIsPlaying] = useState(false);
    const [audio, setAudio] = useState<{
        listener: AudioListener;
        buffer: AudioBuffer;
    } | null>(null);
    const hasRequestedAudio = useRef(false);
    const audioRef = useRef<PositionalAudioImpl>(null);
    const motion = useRef({ armAngle: 0, spinSpeed: 0 });
    const parts = useMemo(
        () => ({
            spin: model.getObjectByName("TurntableSpin"),
            arm: model.getObjectByName("TonearmPivot"),
        }),
        [model]
    );

    let spinSpeed: number,
        spinEase: number,
        tonearmPlayAngle: number,
        tonearmEase: number,
        volume: number,
        audioRefDistance: number;
    let recordBoxSizeX: number,
        recordBoxSizeY: number,
        recordBoxSizeZ: number,
        recordBoxAnchorX: number,
        recordBoxAnchorY: number,
        recordBoxAnchorZ: number;

    // #if DEBUG
    ({
        spinSpeed,
        spinEase,
        tonearmPlayAngle,
        tonearmEase,
        volume,
        audioRefDistance,
        recordBoxSizeX,
        recordBoxSizeY,
        recordBoxSizeZ,
        recordBoxAnchorX,
        recordBoxAnchorY,
        recordBoxAnchorZ,
    } = useControls(
        "Record Player",
        {
            spinSpeed: {
                value: recordPlayer.spinSpeed,
                min: 0,
                max: 15,
                step: 0.01,
            },
            spinEase: {
                value: recordPlayer.spinEase,
                min: 0.1,
                max: 10,
                step: 0.1,
            },
            tonearmPlayAngle: {
                value: recordPlayer.tonearmPlayAngle,
                min: -Math.PI / 2,
                max: 0,
                step: 0.01,
            },
            tonearmEase: {
                value: recordPlayer.tonearmEase,
                min: 0.1,
                max: 20,
                step: 0.1,
            },
            volume: {
                value: recordPlayer.volume,
                min: 0,
                max: 1,
                step: 0.01,
            },
            audioRefDistance: {
                value: recordPlayer.audioRefDistance,
                min: 0.5,
                max: 30,
                step: 0.1,
            },
            recordBoxSizeX: {
                value: recordPlayer.boxSize.x,
                min: 0.1,
                max: 20,
                step: 0.01,
            },
            recordBoxSizeY: {
                value: recordPlayer.boxSize.y,
                min: 0.1,
                max: 20,
                step: 0.01,
            },
            recordBoxSizeZ: {
                value: recordPlayer.boxSize.z,
                min: 0.1,
                max: 20,
                step: 0.01,
            },
            recordBoxAnchorX: {
                value: recordPlayer.boxAnchor.x,
                min: -10,
                max: 10,
                step: 0.01,
            },
            recordBoxAnchorY: {
                value: recordPlayer.boxAnchor.y,
                min: -10,
                max: 10,
                step: 0.01,
            },
            recordBoxAnchorZ: {
                value: recordPlayer.boxAnchor.z,
                min: -10,
                max: 10,
                step: 0.01,
            },
        },
        { collapsed: true }
    ) as RecordPlayerControls);
    // #endif

    // #if !DEBUG
    spinSpeed = recordPlayer.spinSpeed;
    spinEase = recordPlayer.spinEase;
    tonearmPlayAngle = recordPlayer.tonearmPlayAngle;
    tonearmEase = recordPlayer.tonearmEase;
    volume = recordPlayer.volume;
    audioRefDistance = recordPlayer.audioRefDistance;
    recordBoxSizeX = recordPlayer.boxSize.x;
    recordBoxSizeY = recordPlayer.boxSize.y;
    recordBoxSizeZ = recordPlayer.boxSize.z;
    recordBoxAnchorX = recordPlayer.boxAnchor.x;
    recordBoxAnchorY = recordPlayer.boxAnchor.y;
    recordBoxAnchorZ = recordPlayer.boxAnchor.z;
    // #endif

    // The listener rides on the camera, so the music pans and fades as the
    // view moves around the room
    useEffect(() => {
        if (!audio) {
            return;
        }

        const sound = audioRef.current;
        sound?.setBuffer(audio.buffer).setLoop(true);
        camera.add(audio.listener);
        return () => {
            camera.remove(audio.listener);
            if (sound?.isPlaying) {
                sound.stop();
            }
        };
    }, [audio, camera]);

    useEffect(() => {
        audioRef.current?.setVolume(volume);
    }, [audio, volume]);

    useEffect(() => {
        audioRef.current?.setRefDistance(audioRefDistance);
    }, [audio, audioRefDistance]);

    const handleEnter = useCallback(() => {
        unlockAudio();
        setIsPlaying(playing => !playing);

        // The track only downloads once someone first drops the needle. Loaded
        // by hand rather than through a suspending loader, so a failed load
        // leaves a silent turntable instead of taking down the scene.
        if (hasRequestedAudio.current) {
            return;
        }
        hasRequestedAudio.current = true;
        // Its own manager keeps this out of the global load progress, which
        // only tracks the room's initial load
        new AudioLoader(new LoadingManager())
            .loadAsync(RECORD_AUDIO_PATH)
            .then(buffer => setAudio({ listener: new AudioListener(), buffer }))
            .catch(error =>
                console.warn(`Could not load ${RECORD_AUDIO_PATH}`, error)
            );
    }, []);

    // The arm swings over and the platter spins up together, and the music
    // starts once the needle lands. Lifting the arm cuts the music at once
    // while the platter runs down.
    useFrame((_, delta) => {
        const state = motion.current;
        const sound = audioRef.current;

        if (!isPlaying && sound?.isPlaying) {
            sound.pause();
        }

        if (
            !isPlaying &&
            state.spinSpeed < AT_REST &&
            Math.abs(state.armAngle) < AT_REST
        ) {
            return;
        }

        state.armAngle = MathUtils.damp(
            state.armAngle,
            isPlaying ? tonearmPlayAngle : 0,
            tonearmEase,
            delta
        );
        state.spinSpeed = MathUtils.damp(
            state.spinSpeed,
            isPlaying ? spinSpeed : 0,
            spinEase,
            delta
        );

        if (parts.arm) {
            parts.arm.rotation.y = state.armAngle;
        }
        // Clockwise seen from above
        if (parts.spin) {
            parts.spin.rotation.y =
                (parts.spin.rotation.y - state.spinSpeed * delta) %
                (Math.PI * 2);
        }

        const isNeedleDown =
            Math.abs(state.armAngle - tonearmPlayAngle) < NEEDLE_DOWN_TOLERANCE;
        if (isPlaying && isNeedleDown && sound?.buffer && !sound.isPlaying) {
            sound.play();
        }
    });

    const { turntable } = recordPlayer;

    return (
        <>
            {audio && (
                <positionalAudio
                    ref={audioRef}
                    args={[audio.listener]}
                    position={[
                        turntable.x * scale,
                        turntable.y * scale,
                        turntable.z * scale,
                    ]}
                />
            )}
            <InteractionZone
                message={isPlaying ? LIFT_MESSAGE : DROP_MESSAGE}
                size={[recordBoxSizeX, recordBoxSizeY, recordBoxSizeZ]}
                center={[recordBoxAnchorX, recordBoxAnchorY, recordBoxAnchorZ]}
                onEnter={handleEnter}
            />
        </>
    );
});
RecordPlayer.displayName = "RecordPlayer";

export default RecordPlayer;
