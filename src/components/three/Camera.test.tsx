import React from "react";
import { fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    keyboardState,
    mockCamera,
    movementState,
    resetThreeTestState,
    runFrameCallbacks,
    useFrameMock,
} from "../../../__mocks__/threeTestHarness";
import Camera from "./Camera";

describe("Camera", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("registers a frame callback and updates camera lookAt", () => {
        render(<Camera />);

        expect(useFrameMock).toHaveBeenCalledTimes(1);
        runFrameCallbacks();
        expect(mockCamera.lookAt).toHaveBeenCalled();
    });

    const runFrames = (count: number) => {
        for (let i = 0; i < count; i += 1) {
            runFrameCallbacks();
        }
    };

    it("pans the camera look target forward with W", () => {
        render(<Camera />);
        runFrameCallbacks();
        const [initialTarget] = mockCamera.lookAt.mock.calls.at(-1);
        const initialZ = initialTarget.z;

        keyboardState.panForward = true;
        runFrames(20);

        const [pannedTarget] = mockCamera.lookAt.mock.calls.at(-1);
        expect(pannedTarget.z).toBeLessThan(initialZ);
    });

    it("orbits the camera around the focus point with A and D", () => {
        render(<Camera />);
        runFrames(5);
        const initialX = mockCamera.position.x;

        keyboardState.rotateLeft = true;
        runFrames(30);
        expect(mockCamera.position.x).toBeGreaterThan(initialX);

        keyboardState.rotateLeft = false;
        keyboardState.rotateRight = true;
        runFrames(90);
        expect(mockCamera.position.x).toBeLessThan(initialX);
    });

    it("swings around behind the character as it walks", () => {
        render(<Camera />);
        runFrames(5);
        const restingX = mockCamera.position.x;

        // Walking toward screen left (-x): the camera should swing round to
        // the character's right (+x) so it ends up behind it.
        movementState.heading = Math.PI / 2;
        runFrames(600);
        expect(mockCamera.position.x).toBeGreaterThan(restingX + 5);
    });

    it("holds the view while the character stands still", () => {
        render(<Camera />);
        keyboardState.rotateLeft = true;
        runFrames(30);
        keyboardState.rotateLeft = false;
        runFrames(120);
        const orbitedX = mockCamera.position.x;

        runFrames(600);
        expect(mockCamera.position.x).toBeCloseTo(orbitedX, 1);
    });

    it("doesn't whip around when the character walks toward it", () => {
        render(<Camera />);
        runFrames(120);
        const restingX = mockCamera.position.x;

        movementState.heading = Math.PI;
        runFrames(600);
        expect(mockCamera.position.x).toBeCloseTo(restingX, 1);
    });

    it("waits for the recenter delay after manual input before following", () => {
        render(<Camera />);
        movementState.heading = 0;
        keyboardState.rotateLeft = true;
        runFrames(30);
        keyboardState.rotateLeft = false;
        runFrames(5);
        const lastYaw = movementState.setCameraYaw.mock.calls.length;

        // Still inside the delay, so nothing pulls the orbit back yet
        runFrames(20);
        expect(movementState.setCameraYaw.mock.calls.length).toBe(lastYaw);

        runFrames(600);
        expect(movementState.setCameraYaw.mock.calls.at(-1)[0]).toBeCloseTo(
            0,
            2
        );
    });

    it("recenters the pan offset back onto the character", () => {
        render(<Camera />);
        runFrameCallbacks();
        const [initialTarget] = mockCamera.lookAt.mock.calls.at(-1);
        const initialZ = initialTarget.z;

        keyboardState.panForward = true;
        runFrames(20);
        keyboardState.panForward = false;
        runFrames(600);

        const [recenteredTarget] = mockCamera.lookAt.mock.calls.at(-1);
        expect(recenteredTarget.z).toBeCloseTo(initialZ, 1);
    });

    it("handles zoom input events", () => {
        render(<Camera />);
        fireEvent.wheel(window, { deltaY: -100 });
        fireEvent.keyDown(window, { key: "i" });
        fireEvent.keyDown(window, { key: "o" });
    });
});
