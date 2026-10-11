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

    it("pans the camera look target with WASD keys", () => {
        render(<Camera />);
        runFrameCallbacks();
        const [initialTarget] = mockCamera.lookAt.mock.calls.at(-1);
        const initialX = initialTarget.x;

        keyboardState.panRight = true;
        for (let i = 0; i < 20; i += 1) {
            runFrameCallbacks();
        }
        keyboardState.panRight = false;

        const [pannedTarget] = mockCamera.lookAt.mock.calls.at(-1);
        expect(pannedTarget.x).toBeGreaterThan(initialX);
    });

    it("handles zoom input events", () => {
        render(<Camera />);
        fireEvent.wheel(window, { deltaY: -100 });
        fireEvent.keyDown(window, { key: "i" });
        fireEvent.keyDown(window, { key: "o" });
    });
});
