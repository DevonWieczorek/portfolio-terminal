import React from "react";
import { fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
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

    it("handles zoom input events", () => {
        render(<Camera />);
        fireEvent.wheel(window, { deltaY: -100 });
        fireEvent.keyDown(window, { key: "i" });
        fireEvent.keyDown(window, { key: "o" });
    });
});
