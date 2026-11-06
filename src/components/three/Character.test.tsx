import React from "react";
import * as THREE from "three";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    bodyTranslation,
    characterControllerMock,
    colliderMock,
    keyboardState,
    movementState,
    rapierModuleMock,
    resetThreeTestState,
    rigidBodyMock,
    runPhysicsStep,
    sceneState,
} from "../../../__mocks__/threeTestHarness";
import { PHYSICS_TIMESTEP, PLAYER_GROUPS } from "@/lib/constants/physics";
import Character from "./Character";

// Refs resolve to DOM nodes under the mocked renderer, so give each group the
// transforms the component writes to before its effects run
const renderWithTransforms = (ui: React.ReactElement) => {
    const effects: React.EffectCallback[] = [];
    const useEffectSpy = jest
        .spyOn(React, "useEffect")
        .mockImplementation(effect => {
            effects.push(effect);
        });
    const result = render(ui);
    useEffectSpy.mockRestore();
    result.container.querySelectorAll("group").forEach(group => {
        Object.assign(group, {
            position: new THREE.Vector3(),
            rotation: new THREE.Euler(),
            scale: new THREE.Vector3(1, 1, 1),
        });
    });
    effects.forEach(effect => effect());
    return result;
};

const STEP_DISTANCE = sceneState.characterSpeed * PHYSICS_TIMESTEP;

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

    it("moves a fixed distance per physics step", () => {
        renderWithTransforms(<Character />);
        keyboardState.forward = true;

        runPhysicsStep();

        expect(rigidBodyMock.setNextKinematicTranslation).toHaveBeenCalledWith(
            expect.objectContaining({
                x: expect.closeTo(0, 6),
                z: expect.closeTo(-STEP_DISTANCE, 6),
            })
        );
        expect(movementState.setPosition).toHaveBeenCalledWith(
            expect.objectContaining({ z: expect.closeTo(-STEP_DISTANCE, 6) })
        );
    });

    it("moves diagonally at the same speed as straight ahead", () => {
        renderWithTransforms(<Character />);
        keyboardState.forward = true;
        keyboardState.rightward = true;

        runPhysicsStep();

        const [{ x, z }] =
            rigidBodyMock.setNextKinematicTranslation.mock.calls[0];
        expect(Math.hypot(x, z)).toBeCloseTo(STEP_DISTANCE, 6);
    });

    it("asks the character controller how far it can move", () => {
        renderWithTransforms(<Character />);
        keyboardState.forward = true;

        runPhysicsStep();

        expect(
            characterControllerMock.computeColliderMovement
        ).toHaveBeenCalledWith(
            colliderMock,
            expect.objectContaining({ z: expect.closeTo(-STEP_DISTANCE, 6) }),
            rapierModuleMock.QueryFilterFlags.EXCLUDE_SENSORS,
            PLAYER_GROUPS
        );
    });

    it("stays put when the controller reports a blocked path", () => {
        renderWithTransforms(<Character />);
        Object.assign(bodyTranslation, { x: 2, y: 0, z: 3 });
        characterControllerMock.computedMovement.mockReturnValueOnce({
            x: 0,
            y: 0,
            z: 0,
        });
        keyboardState.forward = true;

        runPhysicsStep();

        expect(rigidBodyMock.setNextKinematicTranslation).toHaveBeenCalledWith({
            x: 2,
            y: 0,
            z: 3,
        });
    });

    it("ignores movement keys while input is disabled", () => {
        renderWithTransforms(<Character inputEnabled={false} />);
        keyboardState.forward = true;

        runPhysicsStep();

        expect(
            rigidBodyMock.setNextKinematicTranslation
        ).not.toHaveBeenCalled();
        expect(movementState.setPosition).not.toHaveBeenCalled();
    });
});
