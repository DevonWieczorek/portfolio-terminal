import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import {
    AudioLoader,
    Box3,
    LoadingManager,
    MathUtils,
    Vector3,
    type Object3D,
    type PositionalAudio as PositionalAudioImpl,
} from "three";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";
import { useMusic } from "@/lib/stores/useMusic";
import { useAudio } from "@/lib/stores/useAudio";
import { useReach } from "@/lib/stores/useReach";
import InteractionZone from "@/components/three/InteractionZone";

type RecordPlayerControls = {
    spinSpeed: number;
    spinEase: number;
    tonearmPlayAngle: number;
    tonearmSwingTime: number;
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
// Measured from the track, whose first beat lands at its start
const RECORD_TEMPO = 70;
const DROP_MESSAGE = "Press ENTER to drop the needle.";
const LIFT_MESSAGE = "Press ENTER to lift the needle.";
const AT_REST = 1e-3;

const RecordPlayer = memo(function RecordPlayer({
    model,
    scale,
}: RecordPlayerProps) {
    const { recordPlayer } = useScene();
    const [isPlaying, setIsPlaying] = useState(false);
    const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
    const listener = useAudio(state => state.listener);
    const unlockAudio = useAudio(state => state.unlock);
    const hasRequestedAudio = useRef(false);
    const audioRef = useRef<PositionalAudioImpl>(null);
    // armTravel runs 0 (parked) to 1 (in the grooves)
    const motion = useRef({ armTravel: 0, spinSpeed: 0 });
    const reachFor = useReach(state => state.reachFor);
    // Where the track is, counted on the audio clock so it keeps time even
    // while frames stall in a background tab
    const playback = useRef({ trackTime: 0, contextTime: 0 });
    const setTempo = useMusic(state => state.setTempo);
    const setTrackTime = useMusic(state => state.setTrackTime);
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
        tonearmSwingTime: number,
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
        tonearmSwingTime,
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
            tonearmSwingTime: {
                value: recordPlayer.tonearmSwingTime,
                min: 0.1,
                max: 3,
                step: 0.05,
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
    tonearmSwingTime = recordPlayer.tonearmSwingTime;
    volume = recordPlayer.volume;
    audioRefDistance = recordPlayer.audioRefDistance;
    recordBoxSizeX = recordPlayer.boxSize.x;
    recordBoxSizeY = recordPlayer.boxSize.y;
    recordBoxSizeZ = recordPlayer.boxSize.z;
    recordBoxAnchorX = recordPlayer.boxAnchor.x;
    recordBoxAnchorY = recordPlayer.boxAnchor.y;
    recordBoxAnchorZ = recordPlayer.boxAnchor.z;
    // #endif

    // The shared listener rides on the camera, so the music pans and fades
    // as the view moves around the room
    const hasAudio = listener !== null && buffer !== null;
    useEffect(() => {
        if (!listener || !buffer) {
            return;
        }

        const sound = audioRef.current;
        const track = playback.current;
        sound?.setBuffer(buffer).setLoop(true);
        return () => {
            if (sound?.isPlaying) {
                sound.stop();
            }
            track.trackTime = 0;
            setTempo(null);
        };
    }, [listener, buffer, setTempo]);

    useEffect(() => {
        audioRef.current?.setVolume(volume);
    }, [hasAudio, volume]);

    useEffect(() => {
        audioRef.current?.setRefDistance(audioRefDistance);
    }, [hasAudio, audioRefDistance]);

    // Loaded by hand rather than through a suspending loader, so a failed
    // load leaves a silent turntable instead of taking down the scene
    const loadTrack = useCallback(() => {
        if (hasRequestedAudio.current) {
            return;
        }
        hasRequestedAudio.current = true;
        // Its own manager keeps this out of the global load progress, which
        // only tracks the room's initial load
        new AudioLoader(new LoadingManager())
            .loadAsync(RECORD_AUDIO_PATH)
            .then(setBuffer)
            .catch(error =>
                console.warn(`Could not load ${RECORD_AUDIO_PATH}`, error)
            );
    }, []);

    // Audio unlocks on the visitor's first key press or click, long before
    // they reach the turntable. Fetching and decoding the track then means
    // it's ready by the time the needle drops. Waiting for the unlock keeps
    // the download out of the room's initial load.
    useEffect(() => {
        if (listener) {
            loadTrack();
        }
    }, [listener, loadTrack]);

    const handleEnter = useCallback(() => {
        unlockAudio();
        setIsPlaying(playing => !playing);
        loadTrack();

        // The character reaches for the middle of the tonearm
        if (parts.arm) {
            const { x, y, z } = new Box3()
                .setFromObject(parts.arm)
                .getCenter(new Vector3());
            reachFor({ x, y, z });
        }
    }, [loadTrack, parts.arm, reachFor, unlockAudio]);

    // The arm swings over and the platter spins up together, and the music
    // starts once the needle lands. The swing takes a fixed time on an eased
    // curve, rather than easing exponentially, so the needle lands promptly
    // instead of creeping the last few degrees. Lifting the arm cuts the music at once
    // while the platter runs down.
    useFrame((_, delta) => {
        const state = motion.current;
        const sound = audioRef.current;

        if (!isPlaying && sound?.isPlaying) {
            sound.pause();
            setTempo(null);
        }

        if (sound?.isPlaying && sound.buffer) {
            const { currentTime } = sound.context;
            const track = playback.current;
            track.trackTime =
                (track.trackTime + currentTime - track.contextTime) %
                sound.buffer.duration;
            track.contextTime = currentTime;
            setTrackTime(track.trackTime);
        }

        if (!isPlaying && state.spinSpeed < AT_REST && state.armTravel === 0) {
            return;
        }

        state.armTravel = MathUtils.clamp(
            state.armTravel + ((isPlaying ? 1 : -1) * delta) / tonearmSwingTime,
            0,
            1
        );
        state.spinSpeed = MathUtils.damp(
            state.spinSpeed,
            isPlaying ? spinSpeed : 0,
            spinEase,
            delta
        );

        if (parts.arm) {
            parts.arm.rotation.y =
                tonearmPlayAngle *
                MathUtils.smootherstep(state.armTravel, 0, 1);
        }
        // Clockwise seen from above
        if (parts.spin) {
            parts.spin.rotation.y =
                (parts.spin.rotation.y - state.spinSpeed * delta) %
                (Math.PI * 2);
        }

        const isNeedleDown = state.armTravel === 1;
        if (isPlaying && isNeedleDown && sound?.buffer && !sound.isPlaying) {
            sound.play();
            playback.current.contextTime = sound.context.currentTime;
            setTempo(RECORD_TEMPO);
        }
    });

    const { turntable } = recordPlayer;

    return (
        <>
            {hasAudio && (
                <positionalAudio
                    ref={audioRef}
                    args={[listener]}
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
