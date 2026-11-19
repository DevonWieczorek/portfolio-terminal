import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    experienceState,
    messageState,
    resetThreeTestState,
} from "../../../__mocks__/threeTestHarness";
jest.mock("./Character", () => ({
    __esModule: true,
    default: () => <group data-testid="mock-character" />,
}));
import R3FScene from "./R3FScene";

describe("R3FScene", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders the canvas", () => {
        render(<R3FScene />);

        expect(screen.getByTestId("canvas")).toBeInTheDocument();
    });

    it("runs enter interaction when Enter is pressed in scene mode", () => {
        messageState.interaction = { onEnter: jest.fn() };
        experienceState.mode = "scene";
        experienceState.isTransitioning = false;

        render(<R3FScene />);

        fireEvent.keyDown(window, { key: "Enter" });

        expect(messageState.clearMessage).toHaveBeenCalled();
        expect(messageState.interaction.onEnter).toHaveBeenCalled();
    });

    it("leaves an inspect view when Escape is pressed", () => {
        experienceState.mode = "inspect";
        experienceState.targetMode = "inspect";

        render(<R3FScene />);

        fireEvent.keyDown(window, { key: "Escape" });

        expect(experienceState.exitInspect).toHaveBeenCalled();
        expect(experienceState.exitTerminal).not.toHaveBeenCalled();
    });
});
