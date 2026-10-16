import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import { resetThreeTestState } from "../../../__mocks__/threeTestHarness";
import Baseboards from "./Baseboards";

describe("Baseboards", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("runs trim along every wall, split around the door", () => {
        const { container } = render(<Baseboards />);

        expect(container.querySelectorAll("boxgeometry")).toHaveLength(5);
    });
});
