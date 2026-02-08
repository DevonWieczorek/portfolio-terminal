import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    resetThreeTestState,
    useTextureMock,
} from "../../../__mocks__/threeTestHarness";
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
    });
});
