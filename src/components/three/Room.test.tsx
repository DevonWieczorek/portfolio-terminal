import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    messageState,
    resetThreeTestState,
    useTextureMock,
} from "../../../__mocks__/threeTestHarness";
import { INTRO_MESSAGE } from "@/lib/constants/sceneMessages";
import Room from "./Room";

describe("Room", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders floor and room walls", () => {
        const { container } = render(<Room />);

        expect(useTextureMock).toHaveBeenCalledWith("/textures/wood.jpg");
        expect(
            container.querySelectorAll("mesh").length
        ).toBeGreaterThanOrEqual(6);
        expect(messageState.setMessage).toHaveBeenCalledWith(INTRO_MESSAGE);
    });
});
