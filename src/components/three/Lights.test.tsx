import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import { resetThreeTestState } from "../../../__mocks__/threeTestHarness";
import Lights from "./Lights";

describe("Lights", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders the expected scene lights", () => {
        const { container } = render(<Lights />);

        expect(container.querySelectorAll("ambientlight")).toHaveLength(1);
        expect(container.querySelectorAll("directionallight")).toHaveLength(2);
        expect(container.querySelectorAll("pointlight")).toHaveLength(1);
    });
});
