import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import { resetThreeTestState } from "../../../__mocks__/threeTestHarness";
import SkateboardGroup from "./SkateboardGroup";

describe("SkateboardGroup", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders four skateboard models", () => {
        const { container } = render(
            <SkateboardGroup proximityPosition={[0, 0, 0]} />
        );

        expect(container.querySelectorAll("primitive")).toHaveLength(4);
    });
});
