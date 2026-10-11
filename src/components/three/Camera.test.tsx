import React from "react";
import { fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    keyboardState,
    mockCamera,
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

    it("handles zoom input events", () => {
        render(<Camera />);
        fireEvent.wheel(window, { deltaY: -100 });
        fireEvent.keyDown(window, { key: "i" });
        fireEvent.keyDown(window, { key: "o" });
    });
});
