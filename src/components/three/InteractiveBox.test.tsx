import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import { resetThreeTestState } from "../../../__mocks__/threeTestHarness";
import InteractiveBox from "./InteractiveBox";

describe("InteractiveBox", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders the wrapper group", () => {
        const { container } = render(<InteractiveBox message="Test message" />);

        expect(container.querySelector("group")).toBeInTheDocument();
    });
});
