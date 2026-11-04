import React from "react";
import * as THREE from "three";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    keyboardState,
    movementState,
    resetThreeTestState,
    runFrameCallbacks,
    sceneState,
} from "../../../__mocks__/threeTestHarness";
import Character from "./Character";

// Refs resolve to DOM nodes under the mocked renderer, so give each group the
// transforms the frame loop writes to
const renderWithTransforms = (ui: React.ReactElement) => {
    const useEffectSpy = jest
        .spyOn(React, "useEffect")
        .mockImplementation(() => {});
    const result = render(ui);
    useEffectSpy.mockRestore();
    result.container.querySelectorAll("group").forEach(group => {
        Object.assign(group, {
            position: new THREE.Vector3(),
            rotation: new THREE.Euler(),
            scale: new THREE.Vector3(1, 1, 1),
        });
    });
    return result;
};

describe("Character", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders character geometry", () => {
        const useEffectSpy = jest
            .spyOn(React, "useEffect")
            .mockImplementation(() => {});

        const { container } = render(<Character />);

        expect(container.querySelector("group")).toBeInTheDocument();
        useEffectSpy.mockRestore();
    });

    it("moves the same distance per second at any frame rate", () => {
        renderWithTransforms(<Character />);
        keyboardState.forward = true;

        runFrameCallbacks(0, 1 / 144);

        expect(movementState.setPosition).toHaveBeenCalledWith(
            expect.objectContaining({
                z: expect.closeTo(-sceneState.characterSpeed / 144, 6),
            })
        );
    });

    it("ignores movement keys while input is disabled", () => {
        renderWithTransforms(<Character inputEnabled={false} />);
        keyboardState.forward = true;

        runFrameCallbacks(0, 1 / 60);

        expect(movementState.setPosition).not.toHaveBeenCalled();
    });
});
