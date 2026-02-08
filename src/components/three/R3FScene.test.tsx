import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    experienceState,
    messageState,
    resetThreeTestState,
} from "../../../__mocks__/threeTestHarness";
import { INTRO_MESSAGE } from "@/lib/constants/sceneMessages";
jest.mock("./Character", () => ({
    __esModule: true,
    default: () => <group data-testid="mock-character" />,
}));
import R3FScene from "./R3FScene";

describe("R3FScene", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders canvas and sets intro message", () => {
        render(<R3FScene />);

        expect(screen.getByTestId("canvas")).toBeInTheDocument();
        expect(messageState.setMessage).toHaveBeenCalledWith(INTRO_MESSAGE);
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
});
