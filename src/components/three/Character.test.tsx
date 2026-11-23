import React from "react";
import * as THREE from "three";
import { act, render } from "@testing-library/react";
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
    runFrameCallbacks,
    runPhysicsStep,
    sceneState,
} from "../../../__mocks__/threeTestHarness";
import { PHYSICS_TIMESTEP, PLAYER_GROUPS } from "@/lib/constants/physics";
import { useMusic } from "@/lib/stores/useMusic";
import { useReach } from "@/lib/stores/useReach";
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

// The head pivots at its neck, the only group placed there
const getHead = (container: HTMLElement) =>
    container.querySelector<HTMLElement & THREE.Group>(
        'group[position="0,1.6,0"]'
    );

const getGroupAt = (container: HTMLElement, position: string) =>
    container.querySelector<HTMLElement & THREE.Group>(
        `group[position="${position}"]`
    );
const getLeftArm = (container: HTMLElement) =>
    getGroupAt(container, "-0.8,1.1,0");
const getRightArm = (container: HTMLElement) =>
    getGroupAt(container, "0.8,1.1,0");
// The sway group pivots at the feet
const getSway = (container: HTMLElement) => getGroupAt(container, "0,-1.3,0");

const runFrames = (count: number) => {
    for (let i = 0; i < count; i++) {
        runFrameCallbacks();
    }
};

describe("Character", () => {
    beforeEach(() => {
        resetThreeTestState();
        // A whole beat in, where the nod is at its lowest
        useMusic.setState({ tempo: null, trackTime: 60 / 70 });
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

    it("publishes its walking heading for the camera to follow", () => {
        renderWithTransforms(<Character />);
        keyboardState.rightward = true;

        runPhysicsStep();
        expect(movementState.setHeading).toHaveBeenLastCalledWith(-Math.PI / 2);

        keyboardState.rightward = false;
        runPhysicsStep();
        expect(movementState.setHeading).toHaveBeenLastCalledWith(null);
    });

    it("holds its head still while there's no music", () => {
        const { container } = renderWithTransforms(<Character />);

        runFrames(60);

        expect(getHead(container)?.rotation.x).toBeCloseTo(0, 5);
    });

    it("nods along while the music plays", () => {
        useMusic.setState({ tempo: 70 });
        const { container } = renderWithTransforms(<Character />);

        runFrames(60);

        expect(getHead(container)?.rotation.x).toBeLessThan(-0.15);
    });

    it("stops nodding while walking", () => {
        useMusic.setState({ tempo: 70 });
        const { container } = renderWithTransforms(<Character />);
        keyboardState.forward = true;

        runPhysicsStep();
        runFrames(60);

        expect(getHead(container)?.rotation.x).toBeCloseTo(0, 2);
    });

    it("eases its head back up once the music stops", () => {
        useMusic.setState({ tempo: 70 });
        const { container } = renderWithTransforms(<Character />);
        runFrames(60);

        useMusic.setState({ tempo: null });
        runFrames(60);

        expect(getHead(container)?.rotation.x).toBeCloseTo(0, 2);
    });

    it("throws its arms up and sways while the music plays", () => {
        useMusic.setState({ tempo: 70 });
        const { container } = renderWithTransforms(<Character />);

        runFrames(60);

        // Overhead in a V: each arm rotated well past horizontal, outward
        expect(getLeftArm(container)?.rotation.z).toBeLessThan(-2);
        expect(getRightArm(container)?.rotation.z).toBeGreaterThan(2);
        // On the beat, the body leans to one side
        expect(Math.abs(getSway(container)?.rotation.z ?? 0)).toBeGreaterThan(
            0.05
        );
    });

    it("drops its arms and stands up straight to walk", () => {
        useMusic.setState({ tempo: 70 });
        const { container } = renderWithTransforms(<Character />);
        runFrames(60);

        keyboardState.forward = true;
        runPhysicsStep();
        runFrames(90);

        expect(getLeftArm(container)?.rotation.z).toBeCloseTo(0, 1);
        expect(getRightArm(container)?.rotation.z).toBeCloseTo(0, 1);
        expect(getSway(container)?.rotation.z).toBeCloseTo(0, 2);
    });

    describe("reaching", () => {
        // Total reach is 0.2s out + 0.3s hold + 0.35s back
        const HOLDING_FRAMES = 20;
        const DONE_FRAMES = 60;
        const armAngle = (arm: (HTMLElement & THREE.Group) | null) =>
            new THREE.Quaternion()
                .setFromEuler(arm?.rotation ?? new THREE.Euler())
                .angleTo(new THREE.Quaternion());

        it("turns to face the target and reaches an arm out to it", () => {
            const { container } = renderWithTransforms(<Character />);
            const character = container.querySelector<
                HTMLElement & THREE.Group
            >("group[scale]");

            act(() => useReach.getState().reachFor({ x: 3, y: 1, z: 0 }));
            runFrames(HOLDING_FRAMES);

            const reachingArm = Math.max(
                armAngle(getLeftArm(container)),
                armAngle(getRightArm(container))
            );
            expect(reachingArm).toBeGreaterThan(0.8);

            runFrames(60);
            // Facing +X: forward is -Z in model space
            expect(character?.rotation.y).toBeCloseTo(-Math.PI / 2, 1);
        });

        it("eases the arm back once the reach is over", () => {
            const { container } = renderWithTransforms(<Character />);

            act(() => useReach.getState().reachFor({ x: 3, y: 1, z: 0 }));
            runFrames(HOLDING_FRAMES + DONE_FRAMES);

            expect(armAngle(getLeftArm(container))).toBeCloseTo(0, 5);
            expect(armAngle(getRightArm(container))).toBeCloseTo(0, 5);
        });

        it("doesn't replay a reach requested before it mounted", () => {
            act(() => useReach.getState().reachFor({ x: 3, y: 1, z: 0 }));
            const { container } = renderWithTransforms(<Character />);

            runFrames(HOLDING_FRAMES);

            expect(armAngle(getLeftArm(container))).toBeCloseTo(0, 5);
            expect(armAngle(getRightArm(container))).toBeCloseTo(0, 5);
        });
    });
});
