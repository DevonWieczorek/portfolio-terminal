import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import { resetThreeTestState } from "../../../__mocks__/threeTestHarness";
import BassGroup from "./BassGroup";

describe("BassGroup", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders four bass models", () => {
        const { container } = render(<BassGroup />);

        expect(container.querySelectorAll("primitive")).toHaveLength(4);
    });
});
