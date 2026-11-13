import React from "react";
import { act, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AudioLoader, Group } from "three";
import "../../../__mocks__/threeTestHarness";
import {
    frameCallbacks,
    messageState,
    resetThreeTestState,
    sensorProps,
} from "../../../__mocks__/threeTestHarness";
import RecordPlayer from "./RecordPlayer";

// Leaves the record player's frame callback as the only one registered
jest.mock("@/hooks/use-collider-follow", () => ({
    useColliderFollow: jest.fn(),
}));

const DROP_MESSAGE = "Press ENTER to drop the needle.";
const LIFT_MESSAGE = "Press ENTER to lift the needle.";
const AUDIO_PATH = "/audio/a-cup-of-tea.mp3";

const createModel = () => {
    const model = new Group();
    const spin = new Group();
    spin.name = "TurntableSpin";
    const arm = new Group();
    arm.name = "TonearmPivot";
    model.add(spin, arm);
    return { model, spin, arm };
};

const enterZoneAndPressEnter = () => {
    act(() => sensorProps.at(-1)?.onIntersectionEnter?.());
    const [, interaction] = messageState.setMessage.mock.lastCall;
    act(() => interaction.onEnter());
};

// Each render registers a new callback, so only the latest one sees the
// current state
const runFrames = (count: number) => {
    const latest = frameCallbacks.at(-1);
    for (let i = 0; i < count; i++) {
        latest?.({ clock: { elapsedTime: 0 } }, 1 / 60);
    }
};

describe("RecordPlayer", () => {
    let loadAsync: jest.SpyInstance;

    beforeEach(() => {
        resetThreeTestState();
        // Never settles, so the track stays "downloading"
        loadAsync = jest
            .spyOn(AudioLoader.prototype, "loadAsync")
            .mockReturnValue(new Promise(() => {}));
    });

    afterEach(() => {
        loadAsync.mockRestore();
    });

    it("invites the visitor to drop the needle without loading audio", () => {
        const { model } = createModel();
        render(<RecordPlayer model={model} scale={3} />);

        act(() => sensorProps.at(-1)?.onIntersectionEnter?.());

        expect(messageState.setMessage).toHaveBeenLastCalledWith(
            DROP_MESSAGE,
            expect.objectContaining({ onEnter: expect.any(Function) })
        );
        expect(loadAsync).not.toHaveBeenCalled();
    });

    it("drops the needle, loads the track and spins the record on ENTER", () => {
        const { model, spin, arm } = createModel();
        render(<RecordPlayer model={model} scale={3} />);

        enterZoneAndPressEnter();
        runFrames(120);

        expect(messageState.setMessage).toHaveBeenLastCalledWith(
            LIFT_MESSAGE,
            expect.anything()
        );
        expect(loadAsync).toHaveBeenCalledWith(AUDIO_PATH);
        expect(arm.rotation.y).toBeLessThan(-0.5);
        expect(spin.rotation.y).not.toBe(0);
    });

    it("parks the arm and runs the platter down when lifted", () => {
        const { model, spin, arm } = createModel();
        render(<RecordPlayer model={model} scale={3} />);

        enterZoneAndPressEnter();
        runFrames(120);
        enterZoneAndPressEnter();
        runFrames(600);

        expect(messageState.setMessage).toHaveBeenLastCalledWith(
            DROP_MESSAGE,
            expect.anything()
        );
        expect(Math.abs(arm.rotation.y)).toBeLessThan(0.01);
        expect(loadAsync).toHaveBeenCalledTimes(1);

        const restingAngle = spin.rotation.y;
        runFrames(10);
        expect(spin.rotation.y).toBe(restingAngle);
    });

    it("keeps spinning silently when the track fails to load", async () => {
        loadAsync.mockRejectedValue(new Error("Unable to decode audio data"));
        const { model, spin } = createModel();
        render(<RecordPlayer model={model} scale={3} />);

        enterZoneAndPressEnter();
        await act(async () => {});
        runFrames(60);

        expect(console.warn).toHaveBeenCalledWith(
            `Could not load ${AUDIO_PATH}`,
            expect.any(Error)
        );
        expect(spin.rotation.y).not.toBe(0);
    });
});
