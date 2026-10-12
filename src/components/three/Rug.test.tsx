import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import { resetThreeTestState } from "../../../__mocks__/threeTestHarness";
import Rug from "./Rug";

describe("Rug", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders a center and a border ring", () => {
        const { container } = render(<Rug />);

        expect(container.querySelectorAll("cylindergeometry")).toHaveLength(2);
    });
});
