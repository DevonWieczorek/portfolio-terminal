import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    experienceState,
    resetThreeTestState,
} from "../../../__mocks__/threeTestHarness";
import Message from "./Message";

describe("Message", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders message text in scene mode", () => {
        experienceState.mode = "scene";
        render(<Message text="Hello" />);

        expect(screen.getByRole("status")).toBeInTheDocument();
        expect(screen.getByText("Hello")).toBeInTheDocument();
    });

    it("does not render in terminal mode", () => {
        experienceState.mode = "terminal";
        const { container } = render(<Message text="Hidden" />);

        expect(container).toBeEmptyDOMElement();
    });
});
